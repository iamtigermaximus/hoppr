"use client";
import styled from "styled-components";
import { Warning } from "@phosphor-icons/react";

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
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 4px;
  color: #ef4444;
`;

const Title = styled.h3`
  color: #ef4444;
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

const RetryButton = styled.button`
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

interface ErrorStateProps {
  message?: string;
  description?: string;
  onRetry?: () => void;
}

export function ErrorState({
  message = "Something went wrong",
  description = "Try again or check back later.",
  onRetry,
}: ErrorStateProps) {
  return (
    <Wrapper>
      <IconWrap>
        <Warning size={24} />
      </IconWrap>
      <Title>{message}</Title>
      <Description>{description}</Description>
      {onRetry && <RetryButton onClick={onRetry}>Try again</RetryButton>}
    </Wrapper>
  );
}
