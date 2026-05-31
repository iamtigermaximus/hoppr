"use client";
import { Component, type ReactNode } from "react";
import { Warning } from "@phosphor-icons/react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  /** Label shown in the default fallback (e.g., "This page"). */
  label?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "48px 24px",
            textAlign: "center",
            minHeight: "200px",
            color: "var(--color-text-muted, #737373)",
          }}
        >
          <Warning size={40} color="#f59e0b" style={{ marginBottom: "16px" }} />
          <p style={{ fontWeight: 600, fontSize: "15px", color: "var(--color-text-primary, #fff)", margin: "0 0 8px" }}>
            Something went wrong
          </p>
          <p style={{ fontSize: "13px", margin: "0 0 20px", maxWidth: "320px" }}>
            {this.props.label ?? "This section"} couldn&apos;t load. Try refreshing the page.
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              padding: "8px 20px",
              borderRadius: "10px",
              border: "1px solid var(--color-card-border, #262626)",
              background: "var(--color-card, #1a1a1a)",
              color: "var(--color-text-primary, #fff)",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
