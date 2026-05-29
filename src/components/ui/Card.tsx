"use client";
import styled from "styled-components";

export const Card = styled.div<{ $accent?: string }>`
  background: var(--color-card, #1a1a1a);
  border: 1px solid var(--color-card-border, #262626);
  border-radius: 14px;
  padding: 14px;
  transition: border-color 0.15s ease;
  cursor: pointer;
  &:hover { border-color: ${({ $accent }) => $accent || "#7c3aed33"}; }
`;
