// src/lib/prisma.ts
// Prisma 6 singleton with Neon serverless connection resilience:
// - Eager $connect on startup (validates the pooled connection)
// - Automatic retry (3 attempts) on transient Neon errors (P1001, P1002, P1017, P2024)
// - Process-level graceful disconnect on SIGTERM/SIGINT
// - Suppressed "Closed" connection noise (harmless PgBouncer idle-timeout messages)
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

// Prisma error codes that represent transient Neon connection issues:
// P1001 — can't reach database server
// P1002 — server closed the connection (Neon auto-suspend / PgBouncer idle timeout)
// P1017 — server closed the connection (Neon cold start wake)
// P2024 — timed out fetching a new connection from the pool
const RETRY_CODES = new Set(["P1001", "P1002", "P1017", "P2024"]);
const MAX_RETRIES = 3;

function createPrismaClient(): PrismaClient {
  const base = new PrismaClient({
    log: [
      { emit: "event", level: "error" },
      { emit: "event", level: "warn" },
    ],
  });

  // Filter log output: suppress Neon/PgBouncer "Closed" noise (harmless —
  // Prisma's internal pool detects the dead socket and replaces it automatically).
  // Real errors and warnings still print normally.
  base.$on("error", (e: any) => {
    const msg: string = e?.message ?? e?.target ?? "";
    // "Closed" = Neon auto-suspend or PgBouncer idle timeout dropped the socket.
    // Prisma's pool replaces it internally; this is not a query failure.
    if (msg.includes("Closed")) return;
    console.error("[prisma]", msg);
  });
  base.$on("warn", (e: any) => {
    console.warn("[prisma]", e?.message ?? e);
  });

  // Eagerly connect on startup so the first real query isn't the one
  // that pays the Neon cold‑start penalty.
  if (typeof window === "undefined") {
    base.$connect().catch(() => {
      // Neon cold start — the retry middleware will handle this on first query
    });
  }

  return base.$extends({
    query: {
      $allOperations: async ({ model, operation, args, query }) => {
        let lastError: unknown;
        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
          try {
            return await query(args);
          } catch (error: any) {
            lastError = error;
            const code: string | undefined = error?.code;

            if (attempt < MAX_RETRIES && code && RETRY_CODES.has(code)) {
              const label = model ? `${model}.${operation}` : operation;
              console.warn(
                `[prisma] Retrying ${label} (attempt ${attempt}/${MAX_RETRIES}) after ${code}`,
              );

              // For closed‑connection errors, explicitly reconnect before
              // the next attempt so we don't retry on a dead socket.
              if (code === "P1002" || code === "P1017") {
                try { await base.$disconnect(); } catch {}
                try { await base.$connect(); } catch {}
              }

              // Exponential backoff: 150ms, 300ms, 450ms
              await new Promise((r) => setTimeout(r, 150 * attempt));
              continue;
            }

            throw error;
          }
        }
        throw lastError;
      },
    },
  }) as unknown as PrismaClient;
}

export const prisma: PrismaClient =
  globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Graceful shutdown — disconnect on process exit so Neon doesn't hold
// idle connections after the process terminates.
if (typeof process !== "undefined") {
  const cleanup = async () => {
    if (globalForPrisma.prisma) {
      await globalForPrisma.prisma.$disconnect();
    }
  };
  process.once("SIGTERM", cleanup);
  process.once("SIGINT", cleanup);
}
