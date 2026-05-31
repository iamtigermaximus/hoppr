"use client";
import styled from "styled-components";

const LegendContainer = styled.div`
  position: absolute;
  bottom: 20px;
  right: 10px;
  z-index: 1000;
  background: rgba(10, 10, 10, 0.85);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 10px;

  @media (max-width: 480px) {
    bottom: 80px;
    right: 8px;
    padding: 8px 10px;
  }
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const LegendDot = styled.span<{ $color: string; $size?: number }>`
  width: ${({ $size }) => $size ?? 10}px;
  height: ${({ $size }) => $size ?? 10}px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
  flex-shrink: 0;
`;

const LegendLabel = styled.span`
  color: #a3a3a3;
  white-space: nowrap;
`;

const levels = [
  { color: "#10b981", label: "Quiet", size: 8 },
  { color: "#f59e0b", label: "Getting Busy", size: 12 },
  { color: "#f97316", label: "Busy", size: 16 },
  { color: "#ef4444", label: "Packed", size: 22 },
  { color: "#dc2626", label: "At Capacity", size: 28, pulse: true },
];

export default function HeatMapLegend() {
  return (
    <LegendContainer>
      <div
        style={{
          fontWeight: 700,
          color: "#fff",
          fontSize: "11px",
          marginBottom: "2px",
        }}
      >
        Crowd Level
      </div>
      {levels.map((lvl) => (
        <LegendItem key={lvl.label}>
          <LegendDot
            $color={lvl.color}
            $size={lvl.size}
            style={
              lvl.pulse
                ? {
                    animation:
                      "heatPulse 1.5s ease-in-out infinite",
                  }
                : undefined
            }
          />
          <LegendLabel>{lvl.label}</LegendLabel>
        </LegendItem>
      ))}
      <LegendItem>
        <LegendDot $color="#6b7280" $size={8} />
        <LegendLabel>No Data</LegendLabel>
      </LegendItem>
      <style>{`
        @keyframes heatPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.6); }
          50% { box-shadow: 0 0 0 8px rgba(220, 38, 38, 0); }
        }
      `}</style>
    </LegendContainer>
  );
}
