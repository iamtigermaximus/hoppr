"use client";
import { useState } from "react";
import { useMyPasses } from "@/hooks/usePasses";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { QRCodeView } from "./QRCodeView";
import { Ticket, CheckCircle, XCircle } from "@phosphor-icons/react";
import { formatEventTime } from "@/lib/utils";

function getStatusBadge(pass: any) {
  if (pass.redeemedAt) return <Badge $type="promo">USED</Badge>;
  if (new Date(pass.validUntil) < new Date()) return <Badge $type="featured">EXPIRED</Badge>;
  return <Badge $type="pass">ACTIVE</Badge>;
}

export function PassWallet() {
  const { data: passes = [], isLoading } = useMyPasses();
  const [selectedPass, setSelectedPass] = useState<string | null>(null);

  if (isLoading) return <div style={{ padding: 16, color: "#737373" }}>Loading...</div>;

  const active = passes.filter((p: any) => !p.redeemedAt && new Date(p.validUntil) >= new Date());
  const used = passes.filter((p: any) => p.redeemedAt || new Date(p.validUntil) < new Date());

  return (
    <div style={{ padding: "16px", maxWidth: "600px", margin: "0 auto" }}>
      <h1 style={{ fontWeight: 800, fontSize: "18px", color: "#fff", marginBottom: "16px" }}>My Passes</h1>

      <div style={{ marginBottom: "24px" }}>
        <h3 style={{ color: "#fff", fontWeight: 700, fontSize: "14px", marginBottom: "8px" }}>Active ({active.length})</h3>
        {!active.length && <p style={{ color: "#737373", fontSize: "13px" }}>No active passes. Browse the marketplace!</p>}
        {active.map((pass: any) => (
          <Card key={pass.id} style={{ marginBottom: "8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <Ticket size={24} color="#f59e0b" />
                <div>
                  <div style={{ color: "#fff", fontWeight: 600, fontSize: "13px" }}>{pass.passTitle}</div>
                  <div style={{ color: "#a3a3a3", fontSize: "11px" }}>{pass.venueName} · Valid until {formatEventTime(new Date(pass.validUntil))}</div>
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
          <h3 style={{ color: "#fff", fontWeight: 700, fontSize: "14px", marginBottom: "8px" }}>Past ({used.length})</h3>
          {used.map((pass: any) => (
            <Card key={pass.id} style={{ marginBottom: "8px", opacity: 0.5 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  {pass.redeemedAt ? <CheckCircle size={24} color="#10b981" /> : <XCircle size={24} color="#ef4444" />}
                  <div>
                    <div style={{ color: "#a3a3a3", fontWeight: 600, fontSize: "13px" }}>{pass.passTitle}</div>
                    <div style={{ color: "#737373", fontSize: "11px" }}>{pass.venueName} · €{pass.price}</div>
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
