"use client";
import { usePasses, usePurchasePass } from "@/hooks/usePasses";
import { PassCard } from "./PassCard";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";

export function PassMarketplace() {
  const { data: passes = [], isLoading } = usePasses();
  const { mutate: purchase } = usePurchasePass();
  const router = useRouter();
  const { toast } = useToast();

  const handleBuy = (passId: string) => {
    purchase(passId, { onSuccess: () => { toast("Pass purchased!", "success"); router.push("/passes/my"); } });
  };

  if (isLoading) return <div style={{ padding: 16, color: "#737373" }}>Loading...</div>;

  return (
    <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "8px", maxWidth: "600px", margin: "0 auto" }}>
      <h1 style={{ fontWeight: 800, fontSize: "18px", color: "#fff", letterSpacing: "-0.5px", marginBottom: "8px" }}>VIP Passes</h1>
      {passes.map((pass: any) => <PassCard key={pass.id} pass={pass} onBuy={handleBuy} />)}
    </div>
  );
}
