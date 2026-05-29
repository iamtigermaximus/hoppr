"use client";
import styled, { css } from "styled-components";

type BadgeType = "event" | "promo" | "pass" | "featured";

const badgeColors = {
  event: { bg: "rgba(59,130,246,0.15)", color: "#3b82f6" },
  promo: { bg: "rgba(16,185,129,0.15)", color: "#10b981" },
  pass: { bg: "rgba(245,158,11,0.15)", color: "#f59e0b" },
  featured: { bg: "#f59e0b", color: "#000" },
};

export const Badge = styled.span<{ $type: BadgeType }>`
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 9px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  ${({ $type }) => {
    const c = badgeColors[$type];
    return css`background: ${c.bg}; color: ${c.color};`;
  }}
`;
