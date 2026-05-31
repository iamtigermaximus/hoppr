"use client";
import { useState, useRef, useCallback } from "react";
import QRCode from "react-qr-code";
import { Button } from "@/components/ui/Button";
import { Download, Copy, ArrowsClockwise } from "@phosphor-icons/react";

export default function QRGenerator() {
  const [text, setText] = useState("");
  const [size, setSize] = useState(256);
  const [copied, setCopied] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  const handleDownload = useCallback(() => {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = size * 2; // 2x for retina
      canvas.height = size * 2;
      if (ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      }
      const png = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `qr-code-${Date.now()}.png`;
      link.href = png;
      link.click();
    };

    img.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgData)))}`;
  }, [size]);

  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 14px",
    background: "var(--color-card, #1a1a1a)",
    border: "1px solid var(--color-card-border, #262626)",
    borderRadius: "12px",
    color: "var(--color-text-primary, #fff)",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
  };

  return (
    <div
      style={{
        padding: "24px 16px",
        maxWidth: "480px",
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
      }}
    >
      <div>
        <h1
          style={{
            fontWeight: 800,
            fontSize: "22px",
            color: "var(--color-text-primary, #fff)",
            margin: "0 0 4px",
          }}
        >
          QR Code Generator
        </h1>
        <p
          style={{
            fontSize: "13px",
            color: "var(--color-text-muted, #737373)",
            margin: 0,
          }}
        >
          Enter a URL or text to generate a QR code. Download as PNG.
        </p>
      </div>

      <div>
        <label
          style={{
            fontSize: "12px",
            fontWeight: 600,
            color: "var(--color-text-secondary, #a3a3a3)",
            display: "block",
            marginBottom: "6px",
          }}
        >
          URL or Text
        </label>
        <input
          placeholder="https://example.com or any text..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          style={inputStyle}
        />
      </div>

      <div>
        <label
          style={{
            fontSize: "12px",
            fontWeight: 600,
            color: "var(--color-text-secondary, #a3a3a3)",
            display: "block",
            marginBottom: "6px",
          }}
        >
          Size: {size}px
        </label>
        <input
          type="range"
          min={128}
          max={512}
          step={16}
          value={size}
          onChange={(e) => setSize(parseInt(e.target.value))}
          style={{ width: "100%", accentColor: "#7c3aed" }}
        />
      </div>

      {/* QR Code preview */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          padding: "24px",
          background: "#fff",
          borderRadius: "16px",
          minHeight: "200px",
          alignItems: "center",
        }}
        ref={qrRef}
      >
        {text ? (
          <QRCode value={text} size={size} />
        ) : (
          <span style={{ color: "#a3a3a3", fontSize: "13px" }}>
            Enter text to generate a QR code
          </span>
        )}
      </div>

      {text && (
        <div style={{ display: "flex", gap: "8px" }}>
          <Button
            fullWidth
            onClick={handleDownload}
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
          >
            <Download size={16} /> Download PNG
          </Button>
          <Button
            variant="secondary"
            onClick={handleCopy}
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
          >
            {copied ? "Copied!" : <><Copy size={16} /> Copy</>}
          </Button>
        </div>
      )}

      {/* Quick presets */}
      <div>
        <p
          style={{
            fontSize: "11px",
            fontWeight: 600,
            color: "var(--color-text-muted, #737373)",
            marginBottom: "8px",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          Quick Presets
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
          {[
            { label: "Hoppr App", value: typeof window !== "undefined" ? window.location.origin : "" },
            { label: "Helsinki Bars", value: typeof window !== "undefined" ? `${window.location.origin}/bars` : "" },
            { label: "Crowd Map", value: typeof window !== "undefined" ? `${window.location.origin}/map` : "" },
          ].map((preset) => (
            <button
              key={preset.label}
              onClick={() => setText(preset.value)}
              style={{
                padding: "6px 12px",
                borderRadius: "8px",
                border: "1px solid var(--color-card-border, #262626)",
                background: "var(--color-card, #1a1a1a)",
                color: "var(--color-text-secondary, #a3a3a3)",
                fontSize: "11px",
                cursor: "pointer",
                fontWeight: 500,
              }}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
