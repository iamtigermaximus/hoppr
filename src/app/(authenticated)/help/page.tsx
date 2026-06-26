"use client";
import { useRouter } from "next/navigation";
import { ArrowLeft, Envelope } from "@phosphor-icons/react";

const faqs = [
  {
    q: "How do I find bars near me?",
    a: "Open the Discover tab to see bars and events sorted by distance from your location. You can also browse the Map view or search by name in the Bars tab.",
  },
  {
    q: "What do the crowd levels mean?",
    a: "Crowd levels (low, medium, high) are reported by other Hoppr users in real time. Tap the crowd indicator on any venue to submit your own report.",
  },
  {
    q: "How do I create an event?",
    a: "Go to any bar's page and tap 'Create Event.' Give it a title, set the start time, and optionally add a description. Your event will appear in the feed and on the bar's page.",
  },
  {
    q: "Can I promote my event or bar?",
    a: "Yes — Hoppr offers sponsored placements and featured listings for bars. If you own or manage a bar, visit the Hoppr Business portal or contact us for details.",
  },
  {
    q: "How does the personalized feed work?",
    a: "When you're signed in, Hoppr ranks events and promotions based on your interests, the venues you've visited, popularity signals, and distance. Without an account, items are shown chronologically.",
  },
  {
    q: "How do I report a problem?",
    a: "If a bar listing has incorrect information, or you see inappropriate content, email us at safety@hoppr.fi. We handle reports within 24 hours.",
  },
];

export default function HelpPage() {
  const router = useRouter();

  return (
    <div style={{ padding: "16px", maxWidth: "600px", margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginBottom: "24px",
          cursor: "pointer",
        }}
        onClick={() => router.back()}
      >
        <ArrowLeft size={20} color="var(--color-text-muted)" />
        <span
          style={{
            color: "var(--color-text-muted)",
            fontSize: "13px",
            fontWeight: 500,
          }}
        >
          Back
        </span>
      </div>

      <h1
        style={{
          fontWeight: 800,
          fontSize: "18px",
          color: "var(--color-text-primary)",
          marginBottom: "24px",
        }}
      >
        Help &amp; Support
      </h1>

      {faqs.map((faq) => (
        <div key={faq.q} style={{ marginBottom: "24px" }}>
          <h2
            style={{
              fontWeight: 700,
              fontSize: "14px",
              color: "var(--color-text-primary)",
              marginBottom: "6px",
            }}
          >
            {faq.q}
          </h2>
          <p
            style={{
              color: "var(--color-text-muted)",
              fontSize: "13px",
              lineHeight: 1.6,
            }}
          >
            {faq.a}
          </p>
        </div>
      ))}

      <div
        style={{
          marginTop: "32px",
          paddingTop: "20px",
          borderTop: "1px solid var(--color-border, #e5e7eb)",
        }}
      >
        <h2
          style={{
            fontWeight: 700,
            fontSize: "14px",
            color: "var(--color-text-primary)",
            marginBottom: "8px",
          }}
        >
          Still need help?
        </h2>
        <a
          href="mailto:help@hoppr.fi"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            color: "#3b82f6",
            fontSize: "13px",
            fontWeight: 500,
            textDecoration: "none",
          }}
        >
          <Envelope size={16} />
          help@hoppr.fi
        </a>
      </div>
    </div>
  );
}
