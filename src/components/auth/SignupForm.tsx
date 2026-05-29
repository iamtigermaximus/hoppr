"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function SignupForm() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError("");

    if (password.length < 8) { setError("Password must be at least 8 characters"); setLoading(false); return; }

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, username, password }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Registration failed");
      setLoading(false);
      return;
    }

    // Auto sign in after signup
    const signInRes = await signIn("credentials", { email, password, redirect: false });
    if (signInRes?.error) { setError("Account created but sign in failed"); setLoading(false); }
    else router.push("/onboarding");
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px", maxWidth: "360px", margin: "0 auto", width: "100%" }}>
      <Input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required />
      <Input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <Input placeholder="Password (min 8 characters)" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      {error && <p style={{ color: "#ef4444", fontSize: "12px", textAlign: "center" }}>{error}</p>}
      <Button type="submit" fullWidth disabled={loading}>{loading ? "Creating account..." : "Create Account"}</Button>
      <Button type="button" variant="secondary" fullWidth onClick={() => signIn("google", { callbackUrl: "/home" })}>
        Sign up with Google
      </Button>
    </form>
  );
}
