"use client";
import { LoginForm } from "@/components/auth/LoginForm";
import { Logo } from "@/components/auth/Logo";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div style={{
      minHeight: "100dvh",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "24px",
      gap: "28px",
      maxWidth: "440px",
      margin: "0 auto",
    }}>
      <Logo />
      <LoginForm />
      <p style={{ color: "#737373", fontSize: "12px", textAlign: "center" }}>
        Don&apos;t have an account?{" "}
        <Link href="/register" style={{ color: "#7c3aed", textDecoration: "none", fontWeight: 600 }}>Sign up</Link>
      </p>
    </div>
  );
}
