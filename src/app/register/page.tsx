"use client";
import { SignupForm } from "@/components/auth/SignupForm";
import Link from "next/link";

export default function RegisterPage() {
  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px", gap: "24px" }}>
      <h1 style={{ fontWeight: 800, fontSize: "32px", color: "#fff", letterSpacing: "-1px" }}>hoppr</h1>
      <SignupForm />
      <p style={{ color: "#737373", fontSize: "12px" }}>
        Already have an account? <Link href="/login" style={{ color: "#7c3aed", textDecoration: "none" }}>Sign in</Link>
      </p>
    </div>
  );
}
