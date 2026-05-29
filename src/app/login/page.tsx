"use client";
import { LoginForm } from "@/components/auth/LoginForm";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px", gap: "24px" }}>
      <h1 style={{ fontWeight: 800, fontSize: "32px", color: "#fff", letterSpacing: "-1px" }}>hoppr</h1>
      <LoginForm />
      <p style={{ color: "#737373", fontSize: "12px" }}>
        Don&apos;t have an account? <Link href="/register" style={{ color: "#7c3aed", textDecoration: "none" }}>Sign up</Link>
      </p>
    </div>
  );
}
