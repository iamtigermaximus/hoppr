"use client";
import { SignupForm } from "@/components/auth/SignupForm";
import { Logo } from "@/components/auth/Logo";
import Link from "next/link";

export default function RegisterPage() {
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
      <SignupForm />
      <p style={{ color: "#737373", fontSize: "12px", textAlign: "center" }}>
        Already have an account?{" "}
        <Link href="/login" style={{ color: "#7c3aed", textDecoration: "none", fontWeight: 600 }}>Sign in</Link>
      </p>
    </div>
  );
}
