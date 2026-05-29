"use client";
import styled, { css } from "styled-components";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

interface ButtonProps {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
}

export const Button = styled.button.withConfig({
  shouldForwardProp: (prop) => !["variant", "size", "fullWidth"].includes(prop),
})<ButtonProps>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.15s ease;
  min-height: 44px;
  cursor: pointer;

  ${({ size }) => size === "sm" && css`padding: 6px 14px; font-size: 11px;`}
  ${({ size }) => (!size || size === "md") && css`padding: 8px 18px; font-size: 13px;`}
  ${({ size }) => size === "lg" && css`padding: 12px 24px; font-size: 15px;`}
  ${({ fullWidth }) => fullWidth && css`width: 100%;`}

  ${({ variant }) => (!variant || variant === "primary") && css`
    background: #7c3aed;
    color: #fff;
    border: none;
    &:hover:not(:disabled) { background: #6d28d9; }
  `}

  ${({ variant }) => variant === "secondary" && css`
    background: transparent;
    color: var(--color-text-secondary, #a3a3a3);
    border: 1px solid var(--color-card-border, #262626);
    &:hover:not(:disabled) { background: var(--color-card-hover, #1e1e1e); color: var(--color-text-primary, #fff); }
  `}

  ${({ variant }) => variant === "ghost" && css`
    background: transparent;
    color: var(--color-text-secondary, #a3a3a3);
    border: none;
    &:hover:not(:disabled) { color: var(--color-text-primary, #fff); }
  `}

  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;
