"use client";
import { useState, useRef } from "react";
import { PaperPlaneTilt } from "@phosphor-icons/react";

export function ChatInput({ onSend, disabled }: { onSend: (content: string) => void; disabled?: boolean }) {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || disabled) return;
    onSend(input.trim());
    setInput("");
    inputRef.current?.focus();
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", gap: "8px", padding: "12px 16px", borderTop: "1px solid var(--color-card-border, #262626)", background: "var(--color-bg, #0a0a0a)" }}>
      <input
        ref={inputRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={disabled ? "Chat unavailable — reconnecting…" : "Type a message..."}
        disabled={disabled}
        style={{
          flex: 1, background: "var(--color-input-bg, #1a1a1a)", border: "1px solid var(--color-input-border, #262626)", borderRadius: "10px",
          padding: "10px 14px", color: disabled ? "#737373" : "var(--color-text-primary, #fff)", fontSize: "14px", outline: "none",
          opacity: disabled ? 0.5 : 1,
        }}
      />
      <button type="submit" disabled={!input.trim() || disabled} style={{
        width: "44px", height: "44px", background: input.trim() && !disabled ? "#7c3aed" : "var(--color-input-bg, #1a1a1a)",
        border: "1px solid var(--color-input-border, #262626)", borderRadius: "10px", display: "flex", alignItems: "center",
        justifyContent: "center", cursor: input.trim() && !disabled ? "pointer" : "default",
        opacity: disabled ? 0.5 : 1,
      }}>
        <PaperPlaneTilt size={18} color={input.trim() && !disabled ? "#fff" : "var(--color-text-muted, #737373)"} />
      </button>
    </form>
  );
}
