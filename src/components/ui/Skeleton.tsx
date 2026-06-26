"use client";
import styled, { keyframes } from "styled-components";

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

const Base = styled.div<{
  $width?: string;
  $height?: string;
  $radius?: string;
}>`
  width: ${({ $width }) => $width || "100%"};
  height: ${({ $height }) => $height || "16px"};
  border-radius: ${({ $radius }) => $radius || "6px"};
  background: linear-gradient(
    90deg,
    var(--color-card-border, #262626) 25%,
    var(--color-card, #1a1a1a) 50%,
    var(--color-card-border, #262626) 75%
  );
  background-size: 200% 100%;
  animation: ${shimmer} 1.4s ease-in-out infinite;
`;

export function Skeleton({
  width,
  height,
  radius,
  style,
}: {
  width?: string;
  height?: string;
  radius?: string;
  style?: React.CSSProperties;
}) {
  return <Base $width={width} $height={height} $radius={radius} style={style} />;
}

/** Pre-composed card skeleton matching FeedCard / BarCard layout */
export function SkeletonCard() {
  return (
    <div
      style={{
        background: "var(--color-card, #1a1a1a)",
        border: "1px solid var(--color-card-border, #262626)",
        borderRadius: "16px",
        overflow: "hidden",
        display: "flex",
      }}
    >
      {/* Thumbnail */}
      <Skeleton width="120px" height="120px" radius="0" style={{ minWidth: 120 }} />
      {/* Body */}
      <div style={{ padding: "14px 16px", flex: 1, display: "flex", flexDirection: "column", gap: "8px", justifyContent: "center" }}>
        <Skeleton width="30%" height="10px" radius="4px" />
        <Skeleton width="80%" height="14px" radius="4px" />
        <Skeleton width="50%" height="10px" radius="4px" />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Skeleton width="60px" height="28px" radius="8px" />
          <Skeleton width="40px" height="28px" radius="8px" />
        </div>
      </div>
    </div>
  );
}

/** Pre-composed full-width card skeleton for venue listings */
export function SkeletonBarCard() {
  return (
    <div
      style={{
        background: "var(--color-card, #1a1a1a)",
        border: "1px solid var(--color-card-border, #262626)",
        borderRadius: "16px",
        overflow: "hidden",
      }}
    >
      <Skeleton width="100%" height="160px" radius="0" />
      <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: "6px" }}>
        <Skeleton width="60%" height="15px" radius="4px" />
        <Skeleton width="40%" height="11px" radius="4px" />
        <div style={{ display: "flex", gap: "6px", marginTop: "4px" }}>
          <Skeleton width="50px" height="9px" radius="3px" />
          <Skeleton width="50px" height="9px" radius="3px" />
        </div>
      </div>
    </div>
  );
}

/** Pre-composed detail page skeleton */
export function SkeletonDetail() {
  return (
    <div style={{ padding: "16px", maxWidth: "680px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "16px" }}>
      <Skeleton width="100%" height="220px" radius="16px" />
      <Skeleton width="60%" height="24px" radius="6px" />
      <Skeleton width="80%" height="16px" radius="6px" />
      <Skeleton width="100%" height="12px" radius="6px" />
      <Skeleton width="100%" height="12px" radius="6px" />
      <Skeleton width="50%" height="12px" radius="6px" />
    </div>
  );
}
