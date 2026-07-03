"use client";
import styled from "styled-components";
import type { ReactNode } from "react";

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 24px;
  text-align: center;
  gap: 10px;
`;

const IconWrap = styled.div`
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #1a1a1a;
  border: 1px solid #262626;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 4px;
  color: #525252;
`;

const Title = styled.h3`
  color: #a3a3a3;
  font-weight: 600;
  font-size: 14px;
  margin: 0;
`;

const Description = styled.p`
  color: #737373;
  font-size: 12px;
  line-height: 1.5;
  margin: 0;
  max-width: 280px;
`;

const Action = styled.button`
  margin-top: 6px;
  background: none;
  border: 1px solid #333;
  border-radius: 8px;
  color: #a3a3a3;
  font-size: 12px;
  font-weight: 600;
  padding: 8px 16px;
  cursor: pointer;
  transition: all 0.15s;
  &:hover {
    border-color: #7c3aed;
    color: #fff;
  }
`;

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <Wrapper>
      {icon && <IconWrap>{icon}</IconWrap>}
      <Title>{title}</Title>
      {description && <Description>{description}</Description>}
      {action && <Action onClick={action.onClick}>{action.label}</Action>}
    </Wrapper>
  );
}
