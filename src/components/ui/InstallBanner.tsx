"use client";

import styled, { keyframes } from "styled-components";
import { X, DownloadSimple } from "@phosphor-icons/react";

const slideUp = keyframes`
  from { transform: translateY(100%); opacity: 0; }
  to   { transform: translateY(0);    opacity: 1; }
`;

const Wrapper = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 55;
  padding: 12px 16px calc(68px + env(safe-area-inset-bottom, 8px)) 16px;
  background: linear-gradient(180deg, rgba(10,10,10,0) 0%, rgba(10,10,10,0.95) 20%, rgba(10,10,10,1) 100%);
  animation: ${slideUp} 0.35s cubic-bezier(0.16, 1, 0.3, 1);

  @media (min-width: 768px) {
    top: 56px;  /* below desktop header */
    bottom: auto;
    padding: 12px 24px;
    background: rgba(10,10,10,0.95);
    border-bottom: 1px solid #262626;
  }
`;

const Banner = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  max-width: 500px;
  margin: 0 auto;
  padding: 14px 16px;
  background: linear-gradient(135deg, #1a1025, #1a1a1a);
  border: 1px solid rgba(124, 58, 237, 0.25);
  border-radius: 14px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
`;

const IconWrap = styled.div`
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #7c3aed, #5b21b6);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
`;

const TextArea = styled.div`
  flex: 1;
  min-width: 0;
`;

const Title = styled.div`
  font-size: 13px;
  font-weight: 700;
  color: #f9fafb;
  line-height: 1.3;
`;

const Subtitle = styled.div`
  font-size: 11px;
  color: #737373;
  margin-top: 2px;
  line-height: 1.3;
`;

const InstallButton = styled.button`
  flex-shrink: 0;
  background: linear-gradient(135deg, #7c3aed, #5b21b6);
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  padding: 8px 16px;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  white-space: nowrap;
  transition: transform 0.15s, box-shadow 0.15s;

  &:hover {
    transform: scale(1.03);
    box-shadow: 0 4px 16px rgba(124, 58, 237, 0.4);
  }
`;

const DismissButton = styled.button`
  position: absolute;
  top: 8px;
  right: 8px;
  background: none;
  border: none;
  color: #525252;
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  display: flex;

  &:hover {
    color: #737373;
    background: rgba(255, 255, 255, 0.05);
  }
`;

interface InstallBannerProps {
  onInstall: () => void;
  onDismiss: () => void;
}

export function InstallBanner({ onInstall, onDismiss }: InstallBannerProps) {
  return (
    <Wrapper>
      <Banner style={{ position: "relative" }}>
        <DismissButton onClick={onDismiss} aria-label="Dismiss">
          <X size={14} weight="bold" />
        </DismissButton>

        <IconWrap>
          <DownloadSimple size={20} weight="bold" color="#fff" />
        </IconWrap>

        <TextArea>
          <Title>Add Hoppr to your home screen</Title>
          <Subtitle>Get instant access to drink deals & events — no app store needed.</Subtitle>
        </TextArea>

        <InstallButton onClick={onInstall}>Install</InstallButton>
      </Banner>
    </Wrapper>
  );
}
