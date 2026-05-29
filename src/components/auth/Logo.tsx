"use client";
import { BeerBottle } from "@phosphor-icons/react";

export function Logo() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
      <div style={{
        width: "64px", height: "64px",
        background: "linear-gradient(135deg, #7c3aed, #5b21b6)",
        borderRadius: "18px",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 8px 32px rgba(124,58,237,0.3)",
      }}>
        <BeerBottle size={32} color="#fff" weight="fill" />
      </div>
      <h1 style={{
        fontWeight: 800, fontSize: "32px", color: "#fff",
        letterSpacing: "-1px", margin: 0,
      }}>
        hoppr
      </h1>
    </div>
  );
}
