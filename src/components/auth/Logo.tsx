"use client";
import Image from "next/image";

export function Logo() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
      <Image src="/hoppr-neon-nobg.png" alt="Hoppr" width={120} height={120} priority />
    </div>
  );
}
