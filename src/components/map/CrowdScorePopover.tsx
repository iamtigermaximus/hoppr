"use client";
import styled from "styled-components";
import Link from "next/link";
import type { VenueCrowdScore } from "@/hooks/useCrowdScores";

const PopoverWrapper = styled.div`
  min-width: 220px;
  padding: 4px 0;
`;

const VenueName = styled(Link)`
  font-weight: 700;
  font-size: 14px;
  color: var(--color-primary, #7c3aed);
  text-decoration: none;
  display: block;
  margin-bottom: 8px;
  &:hover {
    text-decoration: underline;
  }
`;

const ScoreBar = styled.div`
  height: 6px;
  background: #262626;
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 10px;
`;

const ScoreFill = styled.div<{ $pct: number }>`
  height: 100%;
  width: ${({ $pct }) => $pct}%;
  background: linear-gradient(90deg, #10b981, #f59e0b, #f97316, #ef4444);
  border-radius: 3px;
  transition: width 0.5s ease;
`;

const SignalList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 3px;
  margin-bottom: 10px;
`;

const SignalRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 10px;
`;

const SignalLabel = styled.span`
  color: #a3a3a3;
`;

const SignalValue = styled.span<{ $score: number }>`
  font-weight: 600;
  color: ${({ $score }) =>
    $score >= 15 ? "#ef4444" : $score >= 8 ? "#f59e0b" : "#10b981"};
`;

const ViewVenueButton = styled(Link)`
  display: block;
  width: 100%;
  padding: 8px 0;
  margin-top: 4px;
  border-radius: 8px;
  background: #7c3aed;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  text-align: center;
  text-decoration: none;
  transition: background 0.15s;

  &:hover {
    background: #6d28d9;
  }
`;

const RelevanceBadge = styled.div<{ $bg: string; $color: string }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 10px;
  background: ${(p) => p.$bg};
  color: ${(p) => p.$color};
  font-size: 10px;
  font-weight: 600;
  margin-bottom: 6px;
`;

const relevanceStyles: Record<string, { bg: string; color: string; prefix: string }> = {
  event: { bg: "rgba(245,158,11,0.2)", color: "#fbbf24", prefix: "Your Event" },
  pass: { bg: "rgba(16,185,129,0.2)", color: "#34d399", prefix: "Your Pass" },
  followed: { bg: "rgba(167,139,250,0.2)", color: "#c4b5fd", prefix: "Following" },
};

function getLevelLabel(level: string | null, compositeScore: number): string {
  if (level) return level.replace(/_/g, " ");
  if (compositeScore >= 75) return "At Capacity";
  if (compositeScore >= 55) return "Packed";
  if (compositeScore >= 30) return "Busy";
  if (compositeScore >= 10) return "Getting Busy";
  if (compositeScore > 0) return "Quiet";
  return "No Data";
}

interface CrowdScorePopoverProps {
  venue: VenueCrowdScore;
}

export default function CrowdScorePopover({ venue }: CrowdScorePopoverProps) {
  const levelLabel = getLevelLabel(venue.computedLevel, venue.compositeScore);
  const relStyle = venue.relevance ? relevanceStyles[venue.relevance] : null;

  return (
    <PopoverWrapper>
      {relStyle && (
        <RelevanceBadge $bg={relStyle.bg} $color={relStyle.color}>
          {relStyle.prefix}
        </RelevanceBadge>
      )}
      <VenueName href={`/venues/${venue.id}`}>{venue.name}</VenueName>
      <div
        style={{
          fontSize: "11px",
          color: "#a3a3a3",
          marginBottom: "4px",
        }}
      >
        {levelLabel} · Crowd Score: {venue.compositeScore}/100
      </div>
      <ScoreBar>
        <ScoreFill $pct={venue.compositeScore} />
      </ScoreBar>
      <SignalList>
        <SignalRow>
          <SignalLabel>Crowd Reports</SignalLabel>
          <SignalValue $score={venue.signals.crowdReport.score}>
            {venue.signals.crowdReport.level
              ? venue.signals.crowdReport.level.replace(/_/g, " ")
              : "None"}{" "}
            ({venue.signals.crowdReport.score}%)
          </SignalValue>
        </SignalRow>
        <SignalRow>
          <SignalLabel>Event Attendees</SignalLabel>
          <SignalValue $score={venue.signals.events.score}>
            {venue.signals.events.totalAttendees} attendees (
            {venue.signals.events.score}%)
          </SignalValue>
        </SignalRow>
        <SignalRow>
          <SignalLabel>Recent VIP Scans</SignalLabel>
          <SignalValue $score={venue.signals.vipScans.score}>
            {venue.signals.vipScans.recentScanCount} scans (
            {venue.signals.vipScans.score}%)
          </SignalValue>
        </SignalRow>
        <SignalRow>
          <SignalLabel>Followers</SignalLabel>
          <SignalValue $score={venue.signals.followers.score}>
            {venue.signals.followers.count} (
            {venue.signals.followers.score}%)
          </SignalValue>
        </SignalRow>
      </SignalList>
      <ViewVenueButton href={`/venues/${venue.id}`}>
        View Venue
      </ViewVenueButton>
    </PopoverWrapper>
  );
}
