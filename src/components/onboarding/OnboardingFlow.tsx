"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { CATEGORIES } from "@/lib/constants";

export function OnboardingFlow() {
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const router = useRouter();

  const toggle = (key: string) => {
    setSelected((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  };

  if (step === 0) {
    return (
      <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 24px", gap: "24px", maxWidth: "400px", margin: "0 auto" }}>
        <h2 style={{ fontWeight: 800, fontSize: "24px", color: "#fff", textAlign: "center" }}>Show me bars near me</h2>
        <p style={{ color: "#a3a3a3", fontSize: "13px", textAlign: "center", lineHeight: 1.6 }}>
          Hoppr uses your location to show you nearby drinking establishments. Your location is never stored permanently.
        </p>
        <Button size="lg" fullWidth onClick={() => {
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(() => {}, () => {});
          }
          setStep(1);
        }}>
          Enable Location
        </Button>
        <Button variant="ghost" onClick={() => setStep(1)}>Skip</Button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", padding: "32px 24px", gap: "24px", maxWidth: "400px", margin: "0 auto" }}>
      <h2 style={{ fontWeight: 800, fontSize: "24px", color: "#fff", textAlign: "center" }}>What's your vibe?</h2>
      <p style={{ color: "#a3a3a3", fontSize: "13px", textAlign: "center", lineHeight: 1.6 }}>
        Pick your favorite spots. We'll personalize your feed. You can always change this later.
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "center" }}>
        {CATEGORIES.map((cat) => (
          <Chip key={cat.key} $active={selected.includes(cat.key)} onClick={() => toggle(cat.key)}>
            {cat.label}
          </Chip>
        ))}
      </div>
      <Button size="lg" fullWidth onClick={() => router.push("/")}>
        Done — Show me the feed
      </Button>
      <Button variant="ghost" onClick={() => router.push("/")}>Skip for now</Button>
    </div>
  );
}
