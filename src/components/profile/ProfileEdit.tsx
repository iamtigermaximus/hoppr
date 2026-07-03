"use client";
import { useState, useEffect } from "react";
import styled from "styled-components";
import { useMyProfile, useUpdateProfile } from "@/hooks/useProfile";
import { useQuery } from "@tanstack/react-query";
import { Avatar } from "@/components/ui/Avatar";
import { Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatEventTime } from "@/lib/utils";
import { Skeleton } from "@/components/ui/Skeleton";
import { Calendar, InstagramLogo, FacebookLogo, TwitterLogo, Globe, Gear, SignOut as SignOutIcon, Phone, Wine, Heart } from "@phosphor-icons/react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { CATEGORIES, DRINK_PREFS } from "@/lib/constants";
import { Chip } from "@/components/ui/Chip";

const Section = styled.div`margin-bottom: 24px;`;
const SectionTitle = styled.h3`
  color: var(--color-text-primary, #fff); font-weight: 700; font-size: 14px;
  margin-bottom: 12px;
  display: flex; align-items: center; gap: 8px;
`;

const StatCard = styled(Card)`
  display: flex; align-items: center; gap: 12px;
  padding: 14px;
`;

const labelStyle: React.CSSProperties = { color: "var(--color-text-secondary, #a3a3a3)", fontSize: "11px", fontWeight: 600, marginBottom: "2px" };

const SHOW_INITIAL = 3;

export function ProfileEdit() {
  const router = useRouter();
  const { data: profile, isLoading } = useMyProfile();
  const { mutate: updateProfile, isPending } = useUpdateProfile();
  const { update } = useSession();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const { data: history } = useQuery({
    queryKey: ["profile", "history"],
    queryFn: () => fetch("/api/users/me/history").then(r => r.json()),
  });

  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [instagram, setInstagram] = useState("");
  const [facebook, setFacebook] = useState("");
  const [twitter, setTwitter] = useState("");
  const [interestChips, setInterestChips] = useState<string[]>([]);
  const [customInterests, setCustomInterests] = useState("");
  const [drinkChips, setDrinkChips] = useState<string[]>([]);
  const [languages, setLanguages] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [gallery, setGallery] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (profile) {
      setUsername(profile.username || "");
      setBio(profile.bio || "");
      setPhoneNumber(profile.phoneNumber || "");
      setInstagram(profile.instagram || "");
      setFacebook(profile.facebook || "");
      setTwitter(profile.twitter || "");
      const categoryKeys = new Set<string>(CATEGORIES.map((c) => c.key));
      const chips: string[] = [];
      const custom: string[] = [];
      (profile.interests || []).forEach((i: string) => {
        categoryKeys.has(i) ? chips.push(i) : custom.push(i);
      });
      setInterestChips(chips);
      setCustomInterests(custom.join(", "));
      setDrinkChips(profile.drinkPrefs || []);
      setLanguages((profile.languages || []).join(", "));
      setAvatarUrl(profile.image || "");
      setGallery(profile.gallery || []);
    }
  }, [profile]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); setSaved(false);
    const customList = customInterests
      ? customInterests.split(",").map((s: string) => s.trim()).filter(Boolean)
      : [];
    const combinedInterests = [...interestChips, ...customList];
    updateProfile({
      username, bio: bio || null,
      phoneNumber: phoneNumber || null,
      instagram: instagram || null, facebook: facebook || null, twitter: twitter || null,
      interests: combinedInterests,
      drinkPrefs: drinkChips,
      languages: languages ? languages.split(",").map((s: string) => s.trim()).filter(Boolean) : [],
      image: avatarUrl || null,
      gallery,
    }, {
      onSuccess: async () => {
        setSaved(true);
        // Refresh the session so the header avatar updates immediately
        await update({ image: avatarUrl || null, name: username });
      }
    });
  };

  if (isLoading) return (
    <div style={{ padding: 32, maxWidth: 680, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
        <Skeleton width="80px" height="80px" radius="50%" />
        <div style={{ flex: 1 }}>
          <Skeleton width="60%" height="20px" />
          <Skeleton width="40%" height="14px" style={{ marginTop: 8 }} />
        </div>
      </div>
      <Skeleton width="100%" height="16px" style={{ marginBottom: 12 }} />
      <Skeleton width="100%" height="16px" style={{ marginBottom: 12 }} />
      <Skeleton width="60%" height="16px" />
    </div>
  );
  if (!profile) return <div style={{ padding: 32, textAlign: "center", color: "#ef4444" }}>Failed to load profile</div>;

  const eventsCreated = history?.eventsCreated || [];
  const eventsJoined = history?.eventsJoined || [];

  return (
    <div style={{ padding: "20px 16px", maxWidth: "680px", margin: "0 auto" }}>
      <h1 style={{ fontWeight: 800, fontSize: "22px", color: "var(--color-text-primary, #fff)", marginBottom: "20px" }}>Edit Profile</h1>

      {/* Avatar + Name */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "24px" }}>
        <Avatar src={profile.image} name={profile.username} size={88} />
        <div style={{ color: "var(--color-text-primary, #fff)", fontWeight: 700, fontSize: "18px", marginTop: "10px" }}>{profile.username}</div>
        <div style={{ color: "var(--color-text-muted, #737373)", fontSize: "12px" }}>{profile.email}</div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "24px" }}>
        <div style={{ background: "var(--color-card, #1a1a1a)", borderRadius: "12px", padding: "14px 10px", textAlign: "center", border: "1px solid var(--color-card-border, #262626)" }}>
          <div style={{ color: "#7c3aed", fontWeight: 700, fontSize: "22px" }}>{eventsCreated.length}</div>
          <div style={{ color: "var(--color-text-muted, #737373)", fontSize: "10px", marginTop: "2px" }}>Created</div>
        </div>
        <div style={{ background: "var(--color-card, #1a1a1a)", borderRadius: "12px", padding: "14px 10px", textAlign: "center", border: "1px solid var(--color-card-border, #262626)" }}>
          <div style={{ color: "#3b82f6", fontWeight: 700, fontSize: "22px" }}>{eventsJoined.length}</div>
          <div style={{ color: "var(--color-text-muted, #737373)", fontSize: "10px", marginTop: "2px" }}>Joined</div>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        {/* Basic Info */}
        <Section>
          <SectionTitle>Basic Info</SectionTitle>
          <div style={labelStyle}>Username</div>
          <Input value={username} onChange={(e) => setUsername(e.target.value)} required />
          <div style={{ ...labelStyle, marginTop: "10px" }}>Bio</div>
          <Textarea placeholder="Tell us about yourself..." value={bio} onChange={(e) => setBio(e.target.value)} maxLength={300} />
          <div style={{ ...labelStyle, marginTop: "10px" }}>Phone Number <span style={{ fontWeight: 400, color: "var(--color-text-muted, #737373)" }}>(optional)</span></div>
          <div style={{ position: "relative" }}>
            <Phone size={16} color="var(--color-text-muted, #737373)" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", zIndex: 1 }} />
            <Input placeholder="+358 40 123 4567" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} style={{ paddingLeft: "40px" }} />
          </div>
        </Section>

        {/* Profile Photo */}
        <Section>
          <SectionTitle>Profile Photo</SectionTitle>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <Avatar src={avatarUrl || undefined} name={username} size={80} />
            <div style={{ flex: 1 }}>
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const formData = new FormData();
                  formData.append("file", file);
                  const res = await fetch("/api/upload", { method: "POST", body: formData });
                  if (res.ok) {
                    const data = await res.json();
                    setAvatarUrl(data.url);
                  }
                }}
                style={{ display: "none" }}
                id="avatar-upload"
              />
              <Button type="button" variant="secondary" size="sm" fullWidth onClick={() => document.getElementById("avatar-upload")?.click()}>
                Upload Photo
              </Button>
              <Input
                placeholder="Or paste image URL..."
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                style={{ marginTop: "8px" }}
              />
            </div>
          </div>
        </Section>

        {/* Social Links */}
        <Section>
          <SectionTitle>Social Links <span style={{ color: "var(--color-text-muted, #737373)", fontWeight: 400, fontSize: "11px" }}>(optional)</span></SectionTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ position: "relative" }}>
              <InstagramLogo size={18} color="var(--color-text-muted, #737373)" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", zIndex: 1 }} />
              <Input placeholder="Instagram username" value={instagram} onChange={(e) => setInstagram(e.target.value)} style={{ paddingLeft: "42px" }} />
            </div>
            <div style={{ position: "relative" }}>
              <FacebookLogo size={18} color="var(--color-text-muted, #737373)" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", zIndex: 1 }} />
              <Input placeholder="Facebook profile" value={facebook} onChange={(e) => setFacebook(e.target.value)} style={{ paddingLeft: "42px" }} />
            </div>
            <div style={{ position: "relative" }}>
              <TwitterLogo size={18} color="var(--color-text-muted, #737373)" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", zIndex: 1 }} />
              <Input placeholder="Twitter / X handle" value={twitter} onChange={(e) => setTwitter(e.target.value)} style={{ paddingLeft: "42px" }} />
            </div>
          </div>
        </Section>

        {/* Gallery */}
        <Section>
          <SectionTitle>Photo Gallery <span style={{ color: "var(--color-text-muted, #737373)", fontWeight: 400, fontSize: "11px" }}>(optional)</span></SectionTitle>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={async (e) => {
              const files = e.target.files;
              if (!files?.length) return;
              for (const file of Array.from(files)) {
                const formData = new FormData();
                formData.append("file", file);
                const res = await fetch("/api/upload", { method: "POST", body: formData });
                if (res.ok) {
                  const data = await res.json();
                  setGallery(prev => [...prev, data.url]);
                }
              }
            }}
            style={{ display: "none" }}
            id="gallery-upload"
          />
          <Button type="button" variant="secondary" size="sm" fullWidth onClick={() => document.getElementById("gallery-upload")?.click()}>
            Upload Photos
          </Button>
          {gallery.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", marginTop: "12px" }}>
              {gallery.map((url, i) => (
                <div key={i} style={{ position: "relative", aspectRatio: "1", borderRadius: "10px", overflow: "hidden", background: "var(--color-card, #1a1a1a)" }}>
                  <img src={url} alt={`Gallery ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  <button
                    type="button"
                    onClick={() => setGallery(prev => prev.filter((_, idx) => idx !== i))}
                    style={{ position: "absolute", top: "4px", right: "4px", width: "24px", height: "24px", background: "rgba(0,0,0,0.7)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-primary, #fff)", fontSize: "12px", border: "none", cursor: "pointer" }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Interests — chips matching onboarding UX */}
        <Section>
          <SectionTitle><Heart size={16} color="#7c3aed" /> Interests</SectionTitle>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "10px" }}>
            {CATEGORIES.map((cat) => (
              <Chip
                key={cat.key}
                $active={interestChips.includes(cat.key)}
                onClick={() => setInterestChips((prev) =>
                  prev.includes(cat.key) ? prev.filter((k) => k !== cat.key) : [...prev, cat.key]
                )}
              >
                {cat.label}
              </Chip>
            ))}
          </div>
          <div style={labelStyle}>Custom interests <span style={{ fontWeight: 400, color: "var(--color-text-muted, #737373)" }}>(comma-separated, optional)</span></div>
          <Input placeholder="e.g., techno, karaoke, craft beer" value={customInterests} onChange={(e) => setCustomInterests(e.target.value)} />
        </Section>

        {/* Drink Preferences — chips matching onboarding UX */}
        <Section>
          <SectionTitle><Wine size={16} color="#f59e0b" /> Drink Preferences</SectionTitle>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {DRINK_PREFS.map((d) => (
              <Chip
                key={d.key}
                $active={drinkChips.includes(d.key)}
                onClick={() => setDrinkChips((prev) =>
                  prev.includes(d.key) ? prev.filter((k) => k !== d.key) : [...prev, d.key]
                )}
              >
                {d.label}
              </Chip>
            ))}
          </div>
        </Section>

        {/* Languages */}
        <Section>
          <SectionTitle><Globe size={16} color="#10b981" /> Languages</SectionTitle>
          <div style={labelStyle}>Languages <span style={{ fontWeight: 400, color: "var(--color-text-muted, #737373)" }}>(comma-separated)</span></div>
          <Input placeholder="e.g., Finnish, English, Swedish" value={languages} onChange={(e) => setLanguages(e.target.value)} />
        </Section>

        {saved && <p style={{ color: "#10b981", fontSize: "13px", fontWeight: 600, textAlign: "center" }}>Profile updated!</p>}
        <Button type="submit" size="lg" fullWidth disabled={isPending}>{isPending ? "Saving..." : "Save Changes"}</Button>
      </form>

      {/* Activity History */}
      <div style={{ marginTop: "32px" }}>
        <h2 style={{ fontWeight: 700, fontSize: "18px", color: "var(--color-text-primary, #fff)", marginBottom: "16px" }}>Activity History</h2>

        {eventsCreated.length > 0 && (() => {
          const key = "created";
          const isOpen = expanded.has(key);
          const visible = isOpen ? eventsCreated : eventsCreated.slice(0, SHOW_INITIAL);
          const hasMore = eventsCreated.length > SHOW_INITIAL;
          return (
            <Section>
              <SectionTitle><Calendar size={16} color="#7c3aed" /> Events Created ({eventsCreated.length})</SectionTitle>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {visible.map((e: any) => (
                  <StatCard key={e.id} onClick={() => window.location.href = `/events/${e.id}`}>
                    <div style={{ minWidth: "40px", height: "40px", background: "linear-gradient(135deg, #7c3aed, #5b21b6)", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Calendar size={18} color="#fff" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: "var(--color-text-primary, #fff)", fontWeight: 600, fontSize: "13px" }}>{e.title}</div>
                      <div style={{ color: "var(--color-text-secondary, #a3a3a3)", fontSize: "11px" }}>{e.venueName} · {formatEventTime(new Date(e.startTime))} · {e.participants?.length || 0} joined</div>
                    </div>
                    <Badge $type="event">CREATED</Badge>
                  </StatCard>
                ))}
              </div>
              {hasMore && (
                <button onClick={() => setExpanded(prev => { const s = new Set(prev); isOpen ? s.delete(key) : s.add(key); return s; })}
                  style={{ display: "block", width: "100%", padding: "8px 0", color: "#7c3aed", fontSize: "12px", fontWeight: 600, background: "none", border: "none", cursor: "pointer", textAlign: "center" }}>
                  {isOpen ? "Show less ▲" : `Show all ${eventsCreated.length} ▼`}
                </button>
              )}
            </Section>
          );
        })()}

        {eventsJoined.length > 0 && (() => {
          const key = "joined";
          const isOpen = expanded.has(key);
          const visible = isOpen ? eventsJoined : eventsJoined.slice(0, SHOW_INITIAL);
          const hasMore = eventsJoined.length > SHOW_INITIAL;
          return (
            <Section>
              <SectionTitle><Calendar size={16} color="#3b82f6" /> Events Joined ({eventsJoined.length})</SectionTitle>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {visible.map((e: any) => (
                  <StatCard key={e.id} onClick={() => window.location.href = `/events/${e.id}`}>
                    <div style={{ minWidth: "40px", height: "40px", background: "linear-gradient(135deg, #3b82f6, #1d4ed8)", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Calendar size={18} color="#fff" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: "var(--color-text-primary, #fff)", fontWeight: 600, fontSize: "13px" }}>{e.title}</div>
                      <div style={{ color: "var(--color-text-secondary, #a3a3a3)", fontSize: "11px" }}>{e.venueName} · {formatEventTime(new Date(e.startTime))} · by {e.creator?.username || "Unknown"}</div>
                    </div>
                    <Badge $type="event">JOINED</Badge>
                  </StatCard>
                ))}
              </div>
              {hasMore && (
                <button onClick={() => setExpanded(prev => { const s = new Set(prev); isOpen ? s.delete(key) : s.add(key); return s; })}
                  style={{ display: "block", width: "100%", padding: "8px 0", color: "#7c3aed", fontSize: "12px", fontWeight: 600, background: "none", border: "none", cursor: "pointer", textAlign: "center" }}>
                  {isOpen ? "Show less ▲" : `Show all ${eventsJoined.length} ▼`}
                </button>
              )}
            </Section>
          );
        })()}

        {!eventsCreated.length && !eventsJoined.length && (
          <div style={{ textAlign: "center", padding: "32px 16px", color: "var(--color-text-muted, #737373)", fontSize: "14px" }}>
            <Calendar size={40} color="var(--color-text-muted, #737373)" style={{ marginBottom: "10px" }} />
            <p>No activity yet. Create or join an event to get started!</p>
          </div>
        )}

        {/* Settings & Sign Out */}
        <div style={{ marginTop: "32px", display: "flex", flexDirection: "column", gap: "8px" }}>
          <Button variant="secondary" fullWidth onClick={() => router.push("/settings")}>
            <Gear size={16} /> Settings
          </Button>
          <Button variant="ghost" fullWidth onClick={() => signOut({ callbackUrl: "/login" })} style={{ color: "#ef4444" }}>
            <SignOutIcon size={16} /> Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}
