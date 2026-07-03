"use client";
import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import styled from "styled-components";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { CATEGORIES, DRINK_PREFS } from "@/lib/constants";

/* ------------------------------------------------------------------ */
/*  Styled components for the follow-suggestions step                  */
/* ------------------------------------------------------------------ */

const SuggestionGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
`;

const SuggestionCard = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #1a1a1a;
  border: 1px solid #262626;
  border-radius: 12px;
`;

const SuggestionImage = styled.div<{ $url?: string }>`
  width: 52px;
  height: 52px;
  border-radius: 10px;
  flex-shrink: 0;
  background: ${({ $url }) =>
    $url ? `url(${$url}) center/cover` : "linear-gradient(135deg, #1a0533, #2d1060)"};
`;

const SuggestionInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const SuggestionName = styled.div`
  color: #fff;
  font-weight: 600;
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const SuggestionMeta = styled.div`
  color: #737373;
  font-size: 11px;
  margin-top: 2px;
`;

const FollowButton = styled.button<{ $following?: boolean }>`
  flex-shrink: 0;
  padding: 7px 14px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid ${({ $following }) => ($following ? "#262626" : "#7c3aed")};
  background: ${({ $following }) => ($following ? "transparent" : "#7c3aed")};
  color: ${({ $following }) => ($following ? "#a3a3a3" : "#fff")};
  transition: all 0.15s;
  &:hover {
    border-color: #7c3aed;
  }
`;

const LoadingPulse = styled.div`
  width: 100%;
  height: 52px;
  border-radius: 12px;
  background: #1a1a1a;
  border: 1px solid #262626;
`;

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

interface SuggestedBar {
  id: string;
  name: string;
  type: string | null;
  district: string | null;
  image?: string;
  distance: number;
  isFollowed: boolean;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function OnboardingFlow() {
  const router = useRouter();
  const { data: session, update } = useSession();

  // Step tracking
  const [step, setStep] = useState(0);

  // Step 1 — profile basics
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [bio, setBio] = useState("");
  const [instagram, setInstagram] = useState("");
  const [phone, setPhone] = useState("");

  // Step 2 — interests
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  // Step 3 — drink prefs
  const [selectedDrinks, setSelectedDrinks] = useState<string[]>([]);

  // Step 4 — follow suggestions
  const [suggestedBars, setSuggestedBars] = useState<SuggestedBar[]>([]);
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set());
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // Final submission
  const [completing, setCompleting] = useState(false);

  const existingImage = (session?.user?.image as string) || null;

  /* ---------------------------------------------------------------- */
  /*  Helpers                                                          */
  /* ---------------------------------------------------------------- */

  const toggle = (key: string, selected: string[], setter: (v: string[]) => void) => {
    setter(selected.includes(key) ? selected.filter((k) => k !== key) : [...selected, key]);
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

      const profileRes = await fetch("/api/users/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: url }),
      });
      if (!profileRes.ok) throw new Error("Failed to save profile photo");

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

  const followBar = async (barId: string) => {
    try {
      const res = await fetch(`/api/bars/${barId}/follow`, { method: "POST" });
      if (res.ok) {
        setFollowedIds((prev) => new Set(prev).add(barId));
      }
    } catch {
      // silent
    }
  };

  const unfollowBar = async (barId: string) => {
    try {
      const res = await fetch(`/api/bars/${barId}/follow`, { method: "DELETE" });
      if (res.ok) {
        setFollowedIds((prev) => {
          const next = new Set(prev);
          next.delete(barId);
          return next;
        });
      }
    } catch {
      // silent
    }
  };

  /* ---------------------------------------------------------------- */
  /*  Load follow suggestions when reaching step 4                     */
  /* ---------------------------------------------------------------- */

  const fetchSuggestions = useCallback(async () => {
    if (selectedInterests.length === 0) return;
    setLoadingSuggestions(true);
    try {
      const params = new URLSearchParams({
        types: selectedInterests.join(","),
        limit: "6",
        excludeFollowed: "true",
      });
      const res = await fetch(`/api/bars/suggestions?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch suggestions");
      const data = await res.json();
      setSuggestedBars(data.bars ?? []);
    } catch {
      setSuggestedBars([]);
    } finally {
      setLoadingSuggestions(false);
    }
  }, [selectedInterests]);

  useEffect(() => {
    if (step === 4) {
      fetchSuggestions();
    }
  }, [step, fetchSuggestions]);

  /* ---------------------------------------------------------------- */
  /*  Final completion — save everything                               */
  /* ---------------------------------------------------------------- */

  const handleComplete = async () => {
    setCompleting(true);
    try {
      // Save profile fields + preferences
      const profilePayload: Record<string, unknown> = {
        interests: selectedInterests,
        drinkPrefs: selectedDrinks,
        onboardingCompleted: true,
        activatedAt: new Date().toISOString(),
      };
      if (bio) profilePayload.bio = bio;
      if (instagram) profilePayload.instagram = instagram;
      if (phone) profilePayload.phoneNumber = phone;

      await fetch("/api/users/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profilePayload),
      });

      // Refresh session so home page sees onboardingCompleted = true
      await update({ onboardingCompleted: true });

      // Fire analytics event (fire-and-forget)
      fetch("/api/analytics/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          events: [
            {
              type: "PAGE_VIEW",
              data: {
                event: "ONBOARDING_COMPLETE",
                interests: selectedInterests.join(","),
                drinkPrefs: selectedDrinks.join(","),
                followedBars: Array.from(followedIds).join(","),
              },
            },
          ],
        }),
      }).catch(() => {});

      router.push("/home");
    } catch {
      // Still redirect even on error — user shouldn't be stuck
      router.push("/home");
    } finally {
      setCompleting(false);
    }
  };

  /* ---------------------------------------------------------------- */
  /*  Step 0 — Location                                                */
  /* ---------------------------------------------------------------- */

  if (step === 0) {
    return (
      <OnboardingScreen>
        <h2 className="onboarding-title">Show me bars near me</h2>
        <p className="onboarding-desc">
          Hoppr uses your location to show you nearby drinking establishments.
          Your location is never stored permanently.
        </p>
        <Button
          size="lg"
          fullWidth
          onClick={() => {
            if (navigator.geolocation) {
              navigator.geolocation.getCurrentPosition(() => {}, () => {});
            }
            setStep(1);
          }}
        >
          Enable Location
        </Button>
        <Button variant="ghost" onClick={() => setStep(1)}>
          Skip
        </Button>
      </OnboardingScreen>
    );
  }

  /* ---------------------------------------------------------------- */
  /*  Step 1 — Profile basics                                          */
  /* ---------------------------------------------------------------- */

  if (step === 1) {
    const displayImage = photoUrl || existingImage;
    const hasImage = !!displayImage;

    return (
      <OnboardingScreen>
        <h2 className="onboarding-title">Complete your profile</h2>
        <p className="onboarding-desc">
          A real photo and a few details help everyone feel safer. They show
          next to your name when you join events.
        </p>

        {/* Avatar */}
        <div className="onboarding-avatar">
          {displayImage ? (
            <img src={displayImage} alt="Profile" />
          ) : (
            <span className="onboarding-avatar-placeholder">
              {uploading ? "⏳" : "📷"}
            </span>
          )}
        </div>

        {uploading && <p style={{ color: "#737373", fontSize: "13px" }}>Uploading...</p>}
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
              {existingImage && !photoUrl ? "Keep this photo" : "Looks good — continue"}
            </Button>
            <Button
              variant="secondary"
              fullWidth
              onClick={() => document.getElementById("onboarding-photo-upload")?.click()}
              disabled={uploading}
            >
              Upload a different photo
            </Button>
          </>
        ) : (
          <Button
            size="lg"
            fullWidth
            onClick={() => document.getElementById("onboarding-photo-upload")?.click()}
            disabled={uploading}
          >
            {uploading ? "Uploading..." : "Upload a photo"}
          </Button>
        )}

        <div style={{ width: "100%", height: 1, background: "#262626", margin: "4px 0" }} />

        {/* Bio */}
        <div style={{ width: "100%" }}>
          <label className="onboarding-field-label">Bio (optional)</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="A short intro about yourself..."
            maxLength={160}
            rows={3}
            className="onboarding-textarea"
          />
          <span className="onboarding-char-count">{bio.length}/160</span>
        </div>

        {/* Instagram */}
        <div style={{ width: "100%" }}>
          <label className="onboarding-field-label">Instagram (optional)</label>
          <input
            type="text"
            value={instagram}
            onChange={(e) => setInstagram(e.target.value)}
            placeholder="@yourhandle"
            className="onboarding-input"
          />
        </div>

        {/* Phone */}
        <div style={{ width: "100%" }}>
          <label className="onboarding-field-label">Phone number (optional)</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+358 40 123 4567"
            className="onboarding-input"
          />
        </div>

        <Button size="lg" fullWidth onClick={() => setStep(2)}>
          Continue
        </Button>
        <Button variant="ghost" onClick={() => setStep(2)}>
          Skip for now
        </Button>
      </OnboardingScreen>
    );
  }

  /* ---------------------------------------------------------------- */
  /*  Step 2 — Interests                                               */
  /* ---------------------------------------------------------------- */

  if (step === 2) {
    return (
      <OnboardingScreen>
        <h2 className="onboarding-title">What&apos;s your vibe?</h2>
        <p className="onboarding-desc">
          Pick your favorite spots. We&apos;ll personalize your feed. You can
          always change this later.
        </p>
        <div className="onboarding-chips">
          {CATEGORIES.map((cat) => (
            <Chip
              key={cat.key}
              $active={selectedInterests.includes(cat.key)}
              onClick={() => toggle(cat.key, selectedInterests, setSelectedInterests)}
            >
              {cat.label}
            </Chip>
          ))}
        </div>
        <Button size="lg" fullWidth onClick={() => setStep(3)}>
          Continue
        </Button>
        <Button variant="ghost" onClick={() => setStep(3)}>
          Skip for now
        </Button>
      </OnboardingScreen>
    );
  }

  /* ---------------------------------------------------------------- */
  /*  Step 3 — Drink preferences                                       */
  /* ---------------------------------------------------------------- */

  if (step === 3) {
    return (
      <OnboardingScreen>
        <h2 className="onboarding-title">What do you drink?</h2>
        <p className="onboarding-desc">
          Tell us what you enjoy. We&apos;ll surface the right happy hours and
          events for your taste.
        </p>
        <div className="onboarding-chips">
          {DRINK_PREFS.map((d) => (
            <Chip
              key={d.key}
              $active={selectedDrinks.includes(d.key)}
              onClick={() => toggle(d.key, selectedDrinks, setSelectedDrinks)}
            >
              {d.label}
            </Chip>
          ))}
        </div>
        <Button size="lg" fullWidth onClick={() => setStep(4)}>
          Continue
        </Button>
        <Button variant="ghost" onClick={() => setStep(4)}>
          Skip for now
        </Button>
      </OnboardingScreen>
    );
  }

  /* ---------------------------------------------------------------- */
  /*  Step 4 — Follow suggestions                                      */
  /* ---------------------------------------------------------------- */

  return (
    <OnboardingScreen>
      <h2 className="onboarding-title">Follow your spots</h2>
      <p className="onboarding-desc">
        Based on your picks, here are some bars nearby. Follow the ones you
        like — your feed will thank you.
      </p>

      <SuggestionGrid>
        {loadingSuggestions ? (
          <>
            <LoadingPulse />
            <LoadingPulse />
            <LoadingPulse />
          </>
        ) : suggestedBars.length === 0 ? (
          <p style={{ color: "#737373", fontSize: "13px", textAlign: "center", padding: "16px 0" }}>
            No matching bars found nearby. You can discover more on the home page.
          </p>
        ) : (
          suggestedBars.map((bar) => {
            const isFollowing = followedIds.has(bar.id);
            return (
              <SuggestionCard key={bar.id}>
                <SuggestionImage $url={bar.image} />
                <SuggestionInfo>
                  <SuggestionName>{bar.name}</SuggestionName>
                  <SuggestionMeta>
                    {[bar.district, typeof bar.type === "string"
                      ? bar.type.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
                      : null]
                      .filter(Boolean)
                      .join(" · ")}{" "}
                    · {bar.distance < 1
                      ? `${(bar.distance * 1000).toFixed(0)}m`
                      : `${bar.distance.toFixed(1)}km`}
                  </SuggestionMeta>
                </SuggestionInfo>
                <FollowButton
                  $following={isFollowing}
                  onClick={() => (isFollowing ? unfollowBar(bar.id) : followBar(bar.id))}
                >
                  {isFollowing ? "Following" : "Follow"}
                </FollowButton>
              </SuggestionCard>
            );
          })
        )}
      </SuggestionGrid>

      <Button size="lg" fullWidth onClick={handleComplete} disabled={completing}>
        {completing ? "Finishing up..." : "Done — Show me the feed"}
      </Button>
      <Button variant="ghost" onClick={handleComplete} disabled={completing}>
        Skip for now
      </Button>
    </OnboardingScreen>
  );
}

/* ------------------------------------------------------------------ */
/*  Shared layout                                                      */
/* ------------------------------------------------------------------ */

function OnboardingScreen({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "32px 24px 48px",
        gap: "20px",
        maxWidth: "400px",
        margin: "0 auto",
      }}
    >
      <style>{`
        .onboarding-title {
          font-weight: 800;
          font-size: 24px;
          color: #fff;
          text-align: center;
          line-height: 1.3;
        }
        .onboarding-desc {
          color: #a3a3a3;
          font-size: 13px;
          text-align: center;
          line-height: 1.6;
          max-width: 320px;
        }
        .onboarding-avatar {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          overflow: hidden;
          background: #262626;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid #3b82f6;
          flex-shrink: 0;
        }
        .onboarding-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .onboarding-avatar-placeholder {
          font-size: 36px;
          color: #737373;
        }
        .onboarding-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          justify-content: center;
        }
        .onboarding-field-label {
          display: block;
          color: #a3a3a3;
          font-size: 11px;
          font-weight: 600;
          margin-bottom: 6px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .onboarding-input {
          width: 100%;
          padding: 10px 12px;
          background: #1a1a1a;
          border: 1px solid #262626;
          border-radius: 8px;
          color: #fff;
          font-size: 13px;
          outline: none;
          transition: border-color 0.15s;
          box-sizing: border-box;
        }
        .onboarding-input:focus {
          border-color: #7c3aed;
        }
        .onboarding-input::placeholder {
          color: #525252;
        }
        .onboarding-textarea {
          width: 100%;
          padding: 10px 12px;
          background: #1a1a1a;
          border: 1px solid #262626;
          border-radius: 8px;
          color: #fff;
          font-size: 13px;
          outline: none;
          resize: none;
          font-family: inherit;
          transition: border-color 0.15s;
          box-sizing: border-box;
        }
        .onboarding-textarea:focus {
          border-color: #7c3aed;
        }
        .onboarding-textarea::placeholder {
          color: #525252;
        }
        .onboarding-char-count {
          display: block;
          text-align: right;
          color: #525252;
          font-size: 10px;
          margin-top: 4px;
        }
      `}</style>
      {children}
    </div>
  );
}
