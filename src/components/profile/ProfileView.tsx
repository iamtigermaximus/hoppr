"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useUserProfile, useUserEvents } from "@/hooks/useProfile";
import { useQuery } from "@tanstack/react-query";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Warning, InstagramLogo, FacebookLogo, TwitterLogo, Calendar, Heart, Globe, Camera } from "@phosphor-icons/react";
import { formatEventTime } from "@/lib/utils";

export function ProfileView({ id }: { id: string }) {
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id as string | undefined;
  const { data: profile, isLoading } = useUserProfile(id);
  const { data: events = [] } = useUserEvents(id);
  const { data: history } = useQuery({
    queryKey: ["profile", "history"],
    queryFn: () => fetch("/api/users/me/history").then(r => r.json()),
    enabled: id === userId,
  });

  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const LIMIT = 3;

  if (isLoading) return <div style={{ padding: 32, textAlign: "center", color: "#737373" }}>Loading...</div>;
  if (!profile || profile.error) return <div style={{ padding: 32, textAlign: "center", color: "#ef4444" }}>User not found</div>;

  const created = events.filter((e: any) => e.creatorId === id);
  const joined = events.filter((e: any) => e.creatorId !== id);
  const isOwn = id === userId;

  return (
    <div style={{ padding: "24px 16px", maxWidth: "680px", margin: "0 auto" }}>
      {/* Avatar + Name */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "16px" }}>
        <Avatar src={profile.avatarUrl} name={profile.username} size={96} />
        <h1 style={{ fontWeight: 800, fontSize: "24px", color: "#fff", marginTop: "12px" }}>{profile.username}</h1>
        {profile.bio && <p style={{ color: "#a3a3a3", fontSize: "13px", marginTop: "4px", textAlign: "center", maxWidth: "400px" }}>{profile.bio}</p>}
        <p style={{ color: "#737373", fontSize: "11px", marginTop: "6px" }}>
          Joined {new Date(profile.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </p>
      </div>

      {/* Report (only for other users) */}
      {!isOwn && (
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
          <Button variant="ghost" size="sm" onClick={() => setShowReport(true)}>
            <Warning size={14} /> Report
          </Button>
          <Modal open={showReport} onClose={() => setShowReport(false)}>
            <h3 style={{ color: "#fff", fontWeight: 700, fontSize: "16px", marginBottom: "12px" }}>Report User</h3>
            <textarea
              placeholder="Why are you reporting this user?"
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              style={{
                width: "100%", background: "#1a1a1a", border: "1px solid #262626", borderRadius: "10px",
                padding: "12px", color: "#fff", fontSize: "14px", resize: "vertical", minHeight: "80px",
                fontFamily: "inherit", outline: "none",
              }}
            />
            <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
              <Button variant="secondary" fullWidth onClick={() => setShowReport(false)}>Cancel</Button>
              <Button fullWidth onClick={() => { setShowReport(false); setReportReason(""); }}>Submit Report</Button>
            </div>
          </Modal>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginBottom: "20px" }}>
        <div style={{ background: "#1a1a1a", borderRadius: "12px", padding: "14px 10px", textAlign: "center", border: "1px solid #262626" }}>
          <div style={{ color: "#7c3aed", fontWeight: 700, fontSize: "22px" }}>{created.length}</div>
          <div style={{ color: "#737373", fontSize: "10px", marginTop: "2px" }}>Created</div>
        </div>
        <div style={{ background: "#1a1a1a", borderRadius: "12px", padding: "14px 10px", textAlign: "center", border: "1px solid #262626" }}>
          <div style={{ color: "#3b82f6", fontWeight: 700, fontSize: "22px" }}>{joined.length}</div>
          <div style={{ color: "#737373", fontSize: "10px", marginTop: "2px" }}>Joined</div>
        </div>
        <div style={{ background: "#1a1a1a", borderRadius: "12px", padding: "14px 10px", textAlign: "center", border: "1px solid #262626" }}>
          <div style={{ color: "#f59e0b", fontWeight: 700, fontSize: "22px" }}>{history?.passes?.length || 0}</div>
          <div style={{ color: "#737373", fontSize: "10px", marginTop: "2px" }}>Passes</div>
        </div>
      </div>

      {/* Interests */}
      {profile.interests?.length > 0 && (
        <div style={{ marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
            <Heart size={14} color="#7c3aed" />
            <span style={{ color: "#fff", fontWeight: 600, fontSize: "13px" }}>Interests</span>
          </div>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {profile.interests.map((i: string) => (
              <span key={i} style={{ background: "rgba(124,58,237,0.1)", color: "#a78bfa", fontSize: "11px", padding: "4px 10px", borderRadius: "6px" }}>{i}</span>
            ))}
          </div>
        </div>
      )}

      {/* Languages */}
      {profile.languages?.length > 0 && (
        <div style={{ marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
            <Globe size={14} color="#7c3aed" />
            <span style={{ color: "#fff", fontWeight: 600, fontSize: "13px" }}>Languages</span>
          </div>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {profile.languages.map((l: string) => (
              <span key={l} style={{ background: "rgba(16,185,129,0.1)", color: "#10b981", fontSize: "11px", padding: "4px 10px", borderRadius: "6px" }}>{l}</span>
            ))}
          </div>
        </div>
      )}

      {/* Social Links */}
      {(profile.instagram || profile.facebook || profile.twitter) && (
        <div style={{ display: "flex", gap: "12px", justifyContent: "center", marginBottom: "20px" }}>
          {profile.instagram && (
            <a href={`https://instagram.com/${profile.instagram.replace("@", "")}`} target="_blank" rel="noopener" style={{ color: "#737373", display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", textDecoration: "none" }}>
              <InstagramLogo size={18} /> {profile.instagram}
            </a>
          )}
          {profile.facebook && (
            <a href={`https://facebook.com/${profile.facebook}`} target="_blank" rel="noopener" style={{ color: "#737373", display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", textDecoration: "none" }}>
              <FacebookLogo size={18} /> FB
            </a>
          )}
          {profile.twitter && (
            <a href={`https://x.com/${profile.twitter.replace("@", "")}`} target="_blank" rel="noopener" style={{ color: "#737373", display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", textDecoration: "none" }}>
              <TwitterLogo size={18} /> {profile.twitter}
            </a>
          )}
        </div>
      )}

      {/* Gallery */}
      {profile.gallery?.length > 0 && (
        <div style={{ marginBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
            <Camera size={14} color="#7c3aed" />
            <span style={{ color: "#fff", fontWeight: 600, fontSize: "13px" }}>Photos</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "6px" }}>
            {profile.gallery.map((url: string, i: number) => (
              <div key={i} style={{ aspectRatio: "1", borderRadius: "10px", overflow: "hidden", background: "#1a1a1a", cursor: "pointer" }} onClick={() => window.open(url, "_blank")}>
                <img src={url} alt={`Gallery ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Events Created */}
      {created.length > 0 && (() => {
        const key = "created";
        const isOpen = expanded.has(key);
        const visible = isOpen ? created : created.slice(0, LIMIT);
        const hasMore = created.length > LIMIT;
        return (
          <div style={{ marginBottom: "20px" }}>
            <h3 style={{ color: "#fff", fontWeight: 700, fontSize: "14px", marginBottom: "8px" }}>Events Created ({created.length})</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {visible.map((event: any) => (
                <Card key={event.id} $accent="#3b82f644" onClick={() => window.location.href = `/events/${event.id}`}>
                  <Badge $type="event">EVENT</Badge>
                  <div style={{ color: "#fff", fontWeight: 600, fontSize: "13px", marginTop: "4px" }}>{event.title}</div>
                  <div style={{ color: "#a3a3a3", fontSize: "11px" }}>{event.venueName} · {formatEventTime(new Date(event.startTime))}</div>
                </Card>
              ))}
            </div>
            {hasMore && (
              <button onClick={() => setExpanded(prev => { const s = new Set(prev); isOpen ? s.delete(key) : s.add(key); return s; })}
                style={{ width: "100%", padding: "8px 0", color: "#7c3aed", fontSize: "12px", fontWeight: 600, background: "none", border: "none", cursor: "pointer", textAlign: "center" }}>
                {isOpen ? "Show less ▲" : `Show all ${created.length} ▼`}
              </button>
            )}
          </div>
        );
      })()}

      {/* Events Joined */}
      {joined.length > 0 && (() => {
        const key = "joined";
        const isOpen = expanded.has(key);
        const visible = isOpen ? joined : joined.slice(0, LIMIT);
        const hasMore = joined.length > LIMIT;
        return (
          <div style={{ marginBottom: "20px" }}>
            <h3 style={{ color: "#fff", fontWeight: 700, fontSize: "14px", marginBottom: "8px" }}>Events Joined ({joined.length})</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {visible.map((event: any) => (
                <Card key={event.id} onClick={() => window.location.href = `/events/${event.id}`}>
                  <Badge $type="event">EVENT</Badge>
                  <div style={{ color: "#fff", fontWeight: 600, fontSize: "13px", marginTop: "4px" }}>{event.title}</div>
                  <div style={{ color: "#a3a3a3", fontSize: "11px" }}>{event.venueName} · {formatEventTime(new Date(event.startTime))}</div>
                </Card>
              ))}
            </div>
            {hasMore && (
              <button onClick={() => setExpanded(prev => { const s = new Set(prev); isOpen ? s.delete(key) : s.add(key); return s; })}
                style={{ width: "100%", padding: "8px 0", color: "#7c3aed", fontSize: "12px", fontWeight: 600, background: "none", border: "none", cursor: "pointer", textAlign: "center" }}>
                {isOpen ? "Show less ▲" : `Show all ${joined.length} ▼`}
              </button>
            )}
          </div>
        );
      })()}

      {!created.length && !joined.length && (
        <div style={{ textAlign: "center", padding: "24px", color: "#737373", fontSize: "13px" }}>
          <Calendar size={32} color="#737373" style={{ marginBottom: "8px" }} />
          <p>No events yet.</p>
        </div>
      )}
    </div>
  );
}
