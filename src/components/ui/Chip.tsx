"use client";
import styled from "styled-components";

export const Chip = styled.button<{ $active?: boolean }>`
  padding: 5px 14px;
  border-radius: 20px;
  font-size: 10px;
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;
  background: ${({ $active }) => $active ? "#7c3aed" : "var(--color-card, #1a1a1a)"};
  color: ${({ $active }) => $active ? "#fff" : "var(--color-text-secondary, #a3a3a3)"};
  border: 1px solid ${({ $active }) => $active ? "#7c3aed" : "var(--color-card-border, #262626)"};
  transition: all 0.15s;
  &:hover { border-color: #7c3aed; }
`;
