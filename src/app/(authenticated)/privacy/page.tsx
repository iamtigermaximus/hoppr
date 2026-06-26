"use client";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "@phosphor-icons/react";

const sections = [
  {
    title: "What we collect",
    body: "To show you bars and events near you, Hoppr collects your approximate location while you use the app. If you create an account, we store your name, email, and any preferences you set (interests, drink preferences). When you join or create an event, that activity is saved to your profile.",
  },
  {
    title: "How we use it",
    body: "Your location helps us rank nearby venues. Your interests and history help personalize your feed — showing you events and bars you're likely to enjoy. We never sell your personal data to third parties.",
  },
  {
    title: "Who can see your activity",
    body: "Events you create are visible to other Hoppr users. Your profile (name, photo, interests) is visible when you join an event. Your email and location are never shown publicly.",
  },
  {
    title: "Deleting your data",
    body: "You can delete your account at any time from your profile page. This removes your personal information, event history, and preferences. Some anonymized analytics may be retained.",
  },
  {
    title: "Reporting issues",
    body: "If you see inappropriate content or have a safety concern, please email us at safety@hoppr.fi. We review reports within 24 hours.",
  },
  {
    title: "Contact",
    body: "For privacy questions, reach out to privacy@hoppr.fi. Hoppr is operated from Helsinki, Finland, and complies with Finnish and EU data protection laws.",
  },
];

export default function PrivacyPage() {
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
          marginBottom: "20px",
        }}
      >
        Privacy &amp; Safety
      </h1>

      {sections.map((s) => (
        <div key={s.title} style={{ marginBottom: "24px" }}>
          <h2
            style={{
              fontWeight: 700,
              fontSize: "14px",
              color: "var(--color-text-primary)",
              marginBottom: "6px",
            }}
          >
            {s.title}
          </h2>
          <p
            style={{
              color: "var(--color-text-muted)",
              fontSize: "13px",
              lineHeight: 1.6,
            }}
          >
            {s.body}
          </p>
        </div>
      ))}

      <p
        style={{
          color: "var(--color-text-muted)",
          fontSize: "11px",
          marginTop: "32px",
          paddingTop: "16px",
          borderTop: "1px solid var(--color-border, #e5e7eb)",
        }}
      >
        Last updated: June 2026
      </p>
    </div>
  );
}
