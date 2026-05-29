"use client";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatDistance } from "@/lib/utils";
import { MapPin, Ticket } from "@phosphor-icons/react";

export function PassCard({ pass, onBuy }: { pass: any; onBuy?: (id: string) => void }) {
  return (
    <Card>
      <div style={{ display: "flex", gap: "10px" }}>
        <div style={{ minWidth: "48px", height: "48px", background: "linear-gradient(135deg, #f59e0b, #d97706)", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Ticket size={20} color="#fff" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
            <Badge $type="pass">PASS</Badge>
            {pass.distance !== undefined && (
              <span style={{ fontSize: "10px", color: "#737373", display: "inline-flex", alignItems: "center", gap: "2px" }}>
                <MapPin size={10} /> {formatDistance(pass.distance)}
              </span>
            )}
          </div>
          <div style={{ color: "#fff", fontWeight: 600, fontSize: "13px" }}>{pass.title}</div>
          <div style={{ color: "#a3a3a3", fontSize: "11px", marginTop: "2px" }}>{pass.venueName}</div>
          <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginTop: "6px" }}>
            {pass.benefits?.map((b: string) => (
              <span key={b} style={{ background: "rgba(245,158,11,0.1)", color: "#f59e0b", fontSize: "9px", padding: "2px 6px", borderRadius: "4px" }}>{b}</span>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px" }}>
            <div>
              <span style={{ color: "#f59e0b", fontWeight: 700, fontSize: "15px" }}>€{pass.price}</span>
              {pass.originalPrice && pass.originalPrice > pass.price && (
                <span style={{ color: "#737373", fontSize: "11px", textDecoration: "line-through", marginLeft: "6px" }}>€{pass.originalPrice}</span>
              )}
            </div>
            {onBuy && <Button size="sm" onClick={(e) => { e.stopPropagation(); onBuy(pass.id); }}>Buy</Button>}
          </div>
        </div>
      </div>
    </Card>
  );
}
