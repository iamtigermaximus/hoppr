"use client";
import { useState } from "react";
import { ShareNetwork } from "@phosphor-icons/react";

interface ShareButtonProps {
  title: string;
  text?: string;
  /** Override the URL to share. Defaults to window.location.href. */
  url?: string;
  size?: number;
  color?: string;
  style?: React.CSSProperties;
}

export default function ShareButton({
  title,
  text,
  url,
  size = 18,
  color = "var(--color-text-secondary, #a3a3a3)",
  style,
}: ShareButtonProps) {
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleShare = async () => {
    const shareUrl = url ?? (typeof window !== "undefined" ? window.location.href : "");
    const shareData = { title, text, url: shareUrl };

    // Try Web Share API first (triggers native share sheet on mobile/desktop)
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err: any) {
        // User cancelled — don't fall back, just ignore
        if (err?.name === "AbortError") return;
        // Other errors fall through to clipboard fallback
      }
    }

    // Clipboard fallback for desktop or when Web Share fails
    try {
      await navigator.clipboard.writeText(shareUrl);
      setFeedback("Link copied!");
      setTimeout(() => setFeedback(null), 2000);
    } catch {
      setFeedback("Failed to copy");
      setTimeout(() => setFeedback(null), 2000);
    }
  };

  return (
    <button
      onClick={handleShare}
      title="Share"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: 0,
        position: "relative",
        ...style,
      }}
    >
      <ShareNetwork size={size} color={color} />
      {feedback && (
        <span
          style={{
            position: "absolute",
            top: "100%",
            right: 0,
            marginTop: "4px",
            background: "rgba(10,10,10,0.9)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "6px",
            padding: "3px 8px",
            fontSize: "10px",
            color: "#10b981",
            whiteSpace: "nowrap",
            pointerEvents: "none",
          }}
        >
          {feedback}
        </span>
      )}
    </button>
  );
}
