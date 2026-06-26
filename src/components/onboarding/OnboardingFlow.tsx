"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { CATEGORIES } from "@/lib/constants";

export function OnboardingFlow() {
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const router = useRouter();
  const { data: session, update } = useSession();

  const existingImage = (session?.user?.image as string) || null;

  const toggle = (key: string) => {
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    setUploadError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Upload failed");
      }
      const data = await res.json();
      const url = data.url;

      // Save image URL to user profile
      const profileRes = await fetch("/api/users/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: url }),
      });
      if (!profileRes.ok) throw new Error("Failed to save profile photo");

      // Refresh the session so the header avatar updates immediately
      await update({ image: url });

      setPhotoUrl(url);
      return url;
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed. Try again.");
      return null;
    } finally {
      setUploading(false);
    }
  };

  // Step 0: Location
  if (step === 0) {
    return (
      <div
        style={{
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "32px 24px",
          gap: "24px",
          maxWidth: "400px",
          margin: "0 auto",
        }}
      >
        <h2
          style={{
            fontWeight: 800,
            fontSize: "24px",
            color: "#fff",
            textAlign: "center",
          }}
        >
          Show me bars near me
        </h2>
        <p
          style={{
            color: "#a3a3a3",
            fontSize: "13px",
            textAlign: "center",
            lineHeight: 1.6,
          }}
        >
          Hoppr uses your location to show you nearby drinking establishments.
          Your location is never stored permanently.
        </p>
        <Button
          size="lg"
          fullWidth
          onClick={() => {
            if (navigator.geolocation) {
              navigator.geolocation.getCurrentPosition(
                () => {},
                () => {},
              );
            }
            setStep(1);
          }}
        >
          Enable Location
        </Button>
        <Button variant="ghost" onClick={() => setStep(1)}>
          Skip
        </Button>
      </div>
    );
  }

  // Step 1: Profile photo
  if (step === 1) {
    const displayImage = photoUrl || existingImage;
    const hasImage = !!displayImage;

    return (
      <div
        style={{
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "32px 24px",
          gap: "24px",
          maxWidth: "400px",
          margin: "0 auto",
        }}
      >
        <h2
          style={{
            fontWeight: 800,
            fontSize: "24px",
            color: "#fff",
            textAlign: "center",
          }}
        >
          Your profile photo
        </h2>
        <p
          style={{
            color: "#a3a3a3",
            fontSize: "13px",
            textAlign: "center",
            lineHeight: 1.6,
          }}
        >
          A real photo helps everyone feel safer. It shows next to your name
          when you join events.
        </p>

        {/* Avatar preview */}
        <div
          style={{
            width: "120px",
            height: "120px",
            borderRadius: "50%",
            overflow: "hidden",
            background: "#262626",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "2px solid #3b82f6",
          }}
        >
          {displayImage ? (
            <img
              src={displayImage}
              alt="Profile"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <span style={{ fontSize: "40px", color: "#737373" }}>
              {uploading ? "⏳" : "📷"}
            </span>
          )}
        </div>

        {uploading && (
          <p style={{ color: "#737373", fontSize: "13px" }}>
            Uploading...
          </p>
        )}

        {uploadError && (
          <p style={{ color: "#ef4444", fontSize: "12px", textAlign: "center" }}>
            {uploadError}
          </p>
        )}

        <input
          type="file"
          accept="image/*"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            await handleFileUpload(file);
          }}
          style={{ display: "none" }}
          id="onboarding-photo-upload"
        />

        {hasImage ? (
          <>
            <Button size="lg" fullWidth onClick={() => setStep(2)}>
              {existingImage && !photoUrl
                ? "Keep this photo"
                : "Looks good — continue"}
            </Button>
            <Button
              variant="secondary"
              fullWidth
              onClick={() =>
                document.getElementById("onboarding-photo-upload")?.click()
              }
              disabled={uploading}
            >
              Upload a different photo
            </Button>
          </>
        ) : (
          <>
            <Button
              size="lg"
              fullWidth
              onClick={() =>
                document.getElementById("onboarding-photo-upload")?.click()
              }
              disabled={uploading}
            >
              {uploading ? "Uploading..." : "Upload a photo"}
            </Button>
            {existingImage ? (
              <Button
                variant="ghost"
                onClick={() => setStep(2)}
              >
                Skip for now
              </Button>
            ) : (
              <p
                style={{
                  color: "#737373",
                  fontSize: "12px",
                  textAlign: "center",
                }}
              >
                A photo is required for safety. You can change it anytime in
                Settings.
              </p>
            )}
          </>
        )}
      </div>
    );
  }

  // Step 2: Interests
  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "32px 24px",
        gap: "24px",
        maxWidth: "400px",
        margin: "0 auto",
      }}
    >
      <h2
        style={{
          fontWeight: 800,
          fontSize: "24px",
          color: "#fff",
          textAlign: "center",
        }}
      >
        What's your vibe?
      </h2>
      <p
        style={{
          color: "#a3a3a3",
          fontSize: "13px",
          textAlign: "center",
          lineHeight: 1.6,
        }}
      >
        Pick your favorite spots. We'll personalize your feed. You can always
        change this later.
      </p>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "8px",
          justifyContent: "center",
        }}
      >
        {CATEGORIES.map((cat) => (
          <Chip
            key={cat.key}
            $active={selected.includes(cat.key)}
            onClick={() => toggle(cat.key)}
          >
            {cat.label}
          </Chip>
        ))}
      </div>
      <Button size="lg" fullWidth onClick={() => router.push("/home")}>
        Done — Show me the feed
      </Button>
      <Button variant="ghost" onClick={() => router.push("/home")}>
        Skip for now
      </Button>
    </div>
  );
}
