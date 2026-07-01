"use client";
import { useState, useEffect, useCallback } from "react";
import styled from "styled-components";
import { ShareNetwork, X } from "@phosphor-icons/react";

interface SharePromptProps {
  /** Unique key for localStorage dismissal tracking */
  storageKey: string;
  /** Headline text */
  headline: string;
  /** Subtitle explaining why */
  subtitle?: string;
  /** Share data */
  shareTitle: string;
  shareText?: string;
  shareUrl?: string;
  /** Show the prompt (default true) */
  visible?: boolean;
}

const Banner = styled.div<{ $visible: boolean }>`
  display: ${(p) => (p.$visible ? "flex" : "none")};
  align-items: center; gap: 12px;
  background: linear-gradient(135deg, #1a1a2e, #16213e);
  border: 1px solid rgba(245, 158, 11, 0.25);
  border-radius: 12px; padding: 14px 16px; margin-bottom: 16px;
  position: relative;
`;

const IconWrap = styled.div`
  background: linear-gradient(135deg, #f59e0b, #d97706);
  border-radius: 10px; width: 40px; height: 40px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
`;

const TextWrap = styled.div` flex: 1; min-width: 0; `;

const Headline = styled.p`
  color: #fff; font-size: 13px; font-weight: 700; margin: 0 0 2px;
`;

const Sub = styled.p`
  color: #a3a3a3; font-size: 11px; margin: 0;
`;

const ShareCta = styled.button`
  background: #f59e0b; color: #0a0a0a; border: none;
  border-radius: 8px; padding: 8px 14px; font-size: 12px;
  font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 6px;
  flex-shrink: 0; transition: background 0.15s;
  &:hover { background: #d97706; }
`;

const DismissBtn = styled.button`
  background: none; border: none; color: #525252;
  cursor: pointer; padding: 4px; border-radius: 4px;
  flex-shrink: 0;
  &:hover { color: #a3a3a3; }
`;

export default function SharePrompt({
  storageKey,
  headline,
  subtitle,
  shareTitle,
  shareText,
  shareUrl,
  visible = true,
}: SharePromptProps) {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const wasDismissed = localStorage.getItem(`share_prompt_${storageKey}`);
      if (wasDismissed) setDismissed(true);
    }
  }, [storageKey]);

  const handleShare = useCallback(async () => {
    const url = shareUrl ?? (typeof window !== "undefined" ? window.location.href : "");
    const data = { title: shareTitle, text: shareText, url };

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(data);
      } catch {
        // User cancelled or error — ignore
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
      } catch {
        // Clipboard failed — ignore
      }
    }
  }, [shareTitle, shareText, shareUrl]);

  const handleDismiss = () => {
    setDismissed(true);
    if (typeof window !== "undefined") {
      localStorage.setItem(`share_prompt_${storageKey}`, "true");
    }
  };

  const isVisible = visible && !dismissed;

  return (
    <Banner $visible={isVisible}>
      <IconWrap>
        <ShareNetwork size={20} color="#0a0a0a" weight="bold" />
      </IconWrap>
      <TextWrap>
        <Headline>{headline}</Headline>
        {subtitle && <Sub>{subtitle}</Sub>}
      </TextWrap>
      <ShareCta onClick={handleShare}>
        <ShareNetwork size={14} /> Share
      </ShareCta>
      <DismissBtn onClick={handleDismiss} aria-label="Dismiss">
        <X size={16} />
      </DismissBtn>
    </Banner>
  );
}
