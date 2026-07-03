"use client";
import { useState, useMemo } from "react";
import { useMyPasses } from "@/hooks/usePasses";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { QRCodeView } from "./QRCodeView";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import SharePrompt from "@/components/ui/SharePrompt";
import { Ticket, CheckCircle, XCircle } from "@phosphor-icons/react";
import { formatEventTime } from "@/lib/utils";

function getStatusBadge(pass: any) {
  if (pass.status === "USED" || pass.scannedAt) return <Badge $type="promo">USED</Badge>;
  if (new Date(pass.expiresAt) < new Date()) return <Badge $type="featured">EXPIRED</Badge>;
  return <Badge $type="pass">ACTIVE</Badge>;
}

function SkeletonPassRow() {
  return (
    <div
      style={{
        background: "#1a1a1a",
        border: "1px solid #262626",
        borderRadius: "12px",
        padding: "14px 16px",
        marginBottom: "8px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <div style={{ display: "flex", gap: "10px", alignItems: "center", flex: 1 }}>
        <Skeleton width="24px" height="24px" radius="6px" />
        <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1 }}>
          <Skeleton width="60%" height="13px" radius="4px" />
          <Skeleton width="40%" height="11px" radius="4px" />
        </div>
      </div>
      <Skeleton width="60px" height="28px" radius="8px" />
    </div>
  );
}

export function PassWallet() {
  const { data: passes = [], isLoading } = useMyPasses();
  const [selectedPass, setSelectedPass] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div style={{ padding: "16px", maxWidth: "600px", margin: "0 auto" }}>
        <h1 style={{ fontWeight: 800, fontSize: "18px", color: "#fff", marginBottom: "16px" }}>My Passes</h1>
        <SkeletonPassRow />
        <SkeletonPassRow />
        <SkeletonPassRow />
      </div>
    );
  }

  if (passes.length === 0) {
    return (
      <div style={{ padding: "16px", maxWidth: "600px", margin: "0 auto" }}>
        <h1 style={{ fontWeight: 800, fontSize: "18px", color: "#fff", marginBottom: "16px" }}>My Passes</h1>
        <EmptyState
          icon={<Ticket size={24} />}
          title="No passes yet"
          description="Browse the marketplace to grab your first VIP pass."
        />
      </div>
    );
  }

  const active = passes.filter((p: any) =>
    p.status !== "USED" && !p.scannedAt && new Date(p.expiresAt) >= new Date()
  );
  const used = passes.filter((p: any) =>
    p.status === "USED" || p.scannedAt || new Date(p.expiresAt) < new Date()
  );

  // Compute share prompt data from active pass
  const firstActiveBar = active[0]?.bar?.name || "the bar";
  const firstActivePassName = active[0]?.vipPass?.name || "My Pass";

  // Recently-used pass (scanned within last 48 hours) for post-redemption share
  const recentlyUsed = useMemo(() => {
    const now = Date.now();
    const twoDays = 48 * 60 * 60 * 1000;
    return used.find((p: any) => {
      const scannedAt = p.scannedAt ? new Date(p.scannedAt).getTime() : 0;
      return scannedAt > now - twoDays;
    });
  }, [used]);

  return (
    <div style={{ padding: "16px", maxWidth: "600px", margin: "0 auto" }}>
      <h1 style={{ fontWeight: 800, fontSize: "18px", color: "#fff", marginBottom: "16px" }}>My Passes</h1>

      {/* Share prompt — show when user has active passes */}
      {active.length > 0 && (
        <SharePrompt
          storageKey="passes_active"
          headline="Got a pass? Share it with your friends!"
          subtitle={`Invite your crew to grab the same deal at ${firstActiveBar}.`}
          shareTitle={firstActivePassName}
          shareText={`Join me at ${firstActiveBar} — I've got a VIP pass!`}
        />
      )}

      <div style={{ marginBottom: "24px" }}>
        <h3 style={{ color: "#fff", fontWeight: 700, fontSize: "14px", marginBottom: "8px" }}>Active ({active.length})</h3>
        {!active.length && <p style={{ color: "#737373", fontSize: "13px" }}>No active passes. Browse the marketplace!</p>}
        {active.map((pass: any) => (
          <Card key={pass.id} style={{ marginBottom: "8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <Ticket size={24} color="#f59e0b" />
                <div>
                  <div style={{ color: "#fff", fontWeight: 600, fontSize: "13px" }}>{pass.vipPass?.name || "Pass"}</div>
                  <div style={{ color: "#a3a3a3", fontSize: "11px" }}>
                    {pass.bar?.name} · Valid until {formatEventTime(new Date(pass.expiresAt))}
                  </div>
                  <div style={{ marginTop: "4px" }}>{getStatusBadge(pass)}</div>
                </div>
              </div>
              <Button size="sm" onClick={() => setSelectedPass(pass.id)}>Show QR</Button>
            </div>
          </Card>
        ))}
      </div>

      {used.length > 0 && (
        <div>
          {/* Post-redemption share prompt — highest-value viral moment */}
          {recentlyUsed && (
            <SharePrompt
              storageKey={`pass_used_${recentlyUsed.id}`}
              headline={`You just used your pass at ${recentlyUsed.bar?.name || "the bar"}! 🎉`}
              subtitle="Share your experience — let your friends know about this spot."
              shareTitle={`Just used my pass at ${recentlyUsed.bar?.name || "this bar"}`}
              shareText={`I just redeemed a VIP pass at ${recentlyUsed.bar?.name || "a great bar"} on Hoppr. Check it out!`}
            />
          )}
          <h3 style={{ color: "#fff", fontWeight: 700, fontSize: "14px", marginBottom: "8px" }}>Past ({used.length})</h3>
          {used.map((pass: any) => (
            <Card key={pass.id} style={{ marginBottom: "8px", opacity: 0.5 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  {(pass.status === "USED" || pass.scannedAt) ? <CheckCircle size={24} color="#10b981" /> : <XCircle size={24} color="#ef4444" />}
                  <div>
                    <div style={{ color: "#a3a3a3", fontWeight: 600, fontSize: "13px" }}>{pass.vipPass?.name || "Pass"}</div>
                    <div style={{ color: "#737373", fontSize: "11px" }}>
                      {pass.bar?.name} · €{(pass.purchasePriceCents / 100).toFixed(2)}
                    </div>
                    <div style={{ marginTop: "4px" }}>{getStatusBadge(pass)}</div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={!!selectedPass} onClose={() => setSelectedPass(null)}>
        {selectedPass && <QRCodeView purchaseId={selectedPass} />}
      </Modal>
    </div>
  );
}
