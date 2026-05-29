"use client";
import { usePassQR } from "@/hooks/usePasses";
import QRCode from "react-qr-code";
import { Button } from "@/components/ui/Button";
import { useEffect, useState } from "react";

export function QRCodeView({ purchaseId }: { purchaseId: string }) {
  const { data, isLoading } = usePassQR(purchaseId);
  const [timeLeft, setTimeLeft] = useState(60);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(prev => prev <= 1 ? 60 : prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading || !data) {
    return <div style={{ padding: 32, textAlign: "center", color: "#737373" }}>Loading QR code...</div>;
  }

  if (data.error) {
    return <div style={{ padding: 32, textAlign: "center", color: "#ef4444" }}>{data.error}</div>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", padding: "32px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
        <span style={{ fontWeight: 700, fontSize: "14px", color: "#fff" }}>Your Pass QR Code</span>
      </div>
      <div style={{ background: "#fff", padding: "20px", borderRadius: "16px" }}>
        <QRCode value={data.qrData} size={220} />
      </div>
      <p style={{ color: "#737373", fontSize: "13px", textAlign: "center" }}>
        Show this to venue staff for entry.<br />Code refreshes every 60 seconds.
      </p>
      <div style={{ color: "#7c3aed", fontSize: "12px", fontWeight: 600 }}>
        Next refresh: {timeLeft}s
      </div>
    </div>
  );
}
