"use client";
import { useState, useRef } from "react";
import { PaperPlaneTilt } from "@phosphor-icons/react";

export function ChatInput({ onSend }: { onSend: (content: string) => void }) {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
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
        placeholder="Type a message..."
        style={{
          flex: 1, background: "var(--color-input-bg, #1a1a1a)", border: "1px solid var(--color-input-border, #262626)", borderRadius: "10px",
          padding: "10px 14px", color: "var(--color-text-primary, #fff)", fontSize: "14px", outline: "none",
        }}
      />
      <button type="submit" disabled={!input.trim()} style={{
        width: "44px", height: "44px", background: input.trim() ? "#7c3aed" : "var(--color-input-bg, #1a1a1a)",
        border: "1px solid var(--color-input-border, #262626)", borderRadius: "10px", display: "flex", alignItems: "center",
        justifyContent: "center", cursor: input.trim() ? "pointer" : "default",
      }}>
        <PaperPlaneTilt size={18} color={input.trim() ? "#fff" : "var(--color-text-muted, #737373)"} />
      </button>
    </form>
  );
}
