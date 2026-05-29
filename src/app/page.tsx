"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { LandingPage } from "@/components/marketing/LandingPage";
import { useEffect } from "react";

export default function RootPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/home");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0a0a" }}>
        <div style={{ color: "#737373", fontSize: "14px" }}>Loading...</div>
      </div>
    );
  }

  if (status === "authenticated") return null;

  return <LandingPage />;
}
