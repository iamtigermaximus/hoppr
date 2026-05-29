"use client";
import styled from "styled-components";

export const Input = styled.input`
  width: 100%;
  background: var(--color-input-bg, #1a1a1a);
  border: 1px solid var(--color-input-border, #262626);
  border-radius: 10px;
  padding: 12px 14px;
  color: var(--color-text-primary, #fff);
  font-size: 14px;
  outline: none;
  transition: border-color 0.15s;
  min-height: 44px;
  &::placeholder { color: var(--color-text-muted, #737373); }
  &:focus { border-color: var(--color-primary, #7c3aed); }
`;

export const Textarea = styled.textarea`
  width: 100%;
  background: var(--color-input-bg, #1a1a1a);
  border: 1px solid var(--color-input-border, #262626);
  border-radius: 10px;
  padding: 12px 14px;
  color: var(--color-text-primary, #fff);
  font-size: 14px;
  outline: none;
  resize: vertical;
  min-height: 100px;
  font-family: inherit;
  transition: border-color 0.15s;
  &::placeholder { color: var(--color-text-muted, #737373); }
  &:focus { border-color: var(--color-primary, #7c3aed); }
`;
