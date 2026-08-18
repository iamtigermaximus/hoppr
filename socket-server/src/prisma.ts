// socket-server/src/prisma.ts
// Self-contained Prisma client for the standalone Socket.IO server.
//
// Unlike the consumer Next.js app (Vercel serverless), the socket server runs
// as a long-lived Node process (Render), so it uses a standard PrismaClient
// with a TCP connection pool — no Neon HTTP adapter required.
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

// Transient Neon connection error codes (same set as the consumer app):
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

  base.$on("error", (e: any) => {
    const msg: string = e?.message ?? e?.target ?? "";
    if (msg.includes("Closed")) return;
    console.error("[prisma]", msg);
  });
  base.$on("warn", (e: any) => {
    console.warn("[prisma]", e?.message ?? e);
  });

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

process.once("SIGTERM", async () => {
  await prisma.$disconnect();
});
process.once("SIGINT", async () => {
  await prisma.$disconnect();
});
