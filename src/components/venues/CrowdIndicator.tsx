"use client";
import styled from "styled-components";
import { Users, Lightning } from "@phosphor-icons/react";

type CrowdLevel = "QUIET" | "GETTING_BUSY" | "BUSY" | "PACKED" | "AT_CAPACITY";

const levelConfig: Record<
  CrowdLevel,
  { color: string; bg: string; label: string; percent: string; pulse?: boolean; Icon: typeof Users }
> = {
  QUIET: {
    color: "#10b981",
    bg: "rgba(16,185,129,0.15)",
    label: "Quiet",
    percent: "0-30%",
    Icon: Users,
  },
  GETTING_BUSY: {
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.15)",
    label: "Getting Busy",
    percent: "30-50%",
    Icon: Users,
  },
  BUSY: {
    color: "#f97316",
    bg: "rgba(249,115,22,0.15)",
    label: "Busy",
    percent: "50-80%",
    Icon: Users,
  },
  PACKED: {
    color: "#ef4444",
    bg: "rgba(239,68,68,0.15)",
    label: "Packed",
    percent: "80-100%",
    Icon: Lightning,
  },
  AT_CAPACITY: {
    color: "#dc2626",
    bg: "rgba(220,38,38,0.2)",
    label: "At Capacity",
    percent: "100%+",
    pulse: true,
    Icon: Lightning,
  },
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  return `${hours}h ago`;
}

// ── Compact badge for cards ─────────────────────────────────────

const BadgeWrapper = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 10px;
  font-weight: 600;
`;

const BadgeDot = styled.span<{ $color: string; $pulse?: boolean }>`
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
  flex-shrink: 0;
  ${({ $pulse }) =>
    $pulse
      ? "animation: pulseDot 1.5s ease-in-out infinite;"
      : ""}

  @keyframes pulseDot {
    0%, 100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.5); }
    50% { box-shadow: 0 0 0 5px rgba(220, 38, 38, 0); }
  }
`;

const BadgeText = styled.span<{ $color: string }>`
  color: ${({ $color }) => $color};
`;

const BadgeTime = styled.span`
  color: #737373;
`;

// ── Detail variant for venue detail page ─────────────────────────

const DetailWrapper = styled.div<{ $color: string; $bg: string }>`
  background: ${({ $bg }) => $bg};
  border: 1px solid ${({ $color }) => `${$color}44`};
  border-radius: 14px;
  padding: 16px;
  text-align: center;
`;

const DetailIcon = styled.div<{ $color: string }>`
  margin-bottom: 8px;
`;

const DetailLevel = styled.div<{ $color: string }>`
  font-size: 20px;
  font-weight: 700;
  color: ${({ $color }) => $color};
`;

const DetailSubtext = styled.div`
  font-size: 11px;
  color: #a3a3a3;
  margin-top: 4px;
`;

const CapacityBar = styled.div`
  margin-top: 10px;
  height: 6px;
  background: #262626;
  border-radius: 3px;
  overflow: hidden;
`;

const CapacityFill = styled.div<{ $pct: number; $color: string }>`
  height: 100%;
  width: ${({ $pct }) => Math.min($pct, 100)}%;
  background: ${({ $color }) => $color};
  border-radius: 3px;
  transition: width 0.5s ease;
`;

interface CrowdIndicatorProps {
  level: CrowdLevel | null;
  reportedAt: string | null;
  variant: "badge" | "detail";
  capacity?: number | null;
}

export default function CrowdIndicator({
  level,
  reportedAt,
  variant,
  capacity,
}: CrowdIndicatorProps) {
  if (!level) return null;

  const cfg = levelConfig[level];
  if (!cfg) return null;

  const Icon = cfg.Icon;

  if (variant === "badge") {
    return (
      <BadgeWrapper>
        <BadgeDot $color={cfg.color} $pulse={cfg.pulse} />
        <BadgeText $color={cfg.color}>{cfg.label}</BadgeText>
        {reportedAt && <BadgeTime>· {timeAgo(reportedAt)}</BadgeTime>}
      </BadgeWrapper>
    );
  }

  // Detail variant
  const pctMap: Record<string, number> = {
    QUIET: 20,
    GETTING_BUSY: 40,
    BUSY: 65,
    PACKED: 90,
    AT_CAPACITY: 100,
  };

  return (
    <DetailWrapper $color={cfg.color} $bg={cfg.bg}>
      <DetailIcon $color={cfg.color}>
        <Icon size={28} weight="fill" />
      </DetailIcon>
      <DetailLevel $color={cfg.color}>{cfg.label}</DetailLevel>
      <DetailSubtext>
        {cfg.percent} full
        {reportedAt && ` · Reported ${timeAgo(reportedAt)}`}
      </DetailSubtext>
      <CapacityBar>
        <CapacityFill $pct={pctMap[level] || 50} $color={cfg.color} />
      </CapacityBar>
      {capacity && (
        <DetailSubtext style={{ marginTop: "6px" }}>
          Venue capacity: {capacity}
        </DetailSubtext>
      )}
    </DetailWrapper>
  );
}
