"use client";
import { useState } from "react";
import { useMyProfile, useUpdateProfile } from "@/hooks/useProfile";
import { Avatar } from "@/components/ui/Avatar";
import { Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function ProfileEdit() {
  const { data: profile, isLoading } = useMyProfile();
  const { mutate: updateProfile, isPending } = useUpdateProfile();
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [saved, setSaved] = useState(false);

  if (isLoading) return <div style={{ padding: 16, color: "#737373" }}>Loading...</div>;

  // Initialize state once profile loads
  if (profile && !username && !bio) {
    setUsername(profile.username || "");
    setBio(profile.bio || "");
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({ username, bio: bio || null }, { onSuccess: () => setSaved(true) });
  };

  return (
    <div style={{ padding: "24px 16px", maxWidth: "480px", margin: "0 auto" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "24px" }}>
        <Avatar src={profile?.avatarUrl} name={profile?.username} size={80} />
      </div>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        <label style={{ color: "#a3a3a3", fontSize: "12px", fontWeight: 600 }}>Username</label>
        <Input value={username} onChange={(e) => setUsername(e.target.value)} required />
        <label style={{ color: "#a3a3a3", fontSize: "12px", fontWeight: 600 }}>Bio</label>
        <Textarea placeholder="Tell us about yourself..." value={bio} onChange={(e) => setBio(e.target.value)} maxLength={300} />
        {saved && <p style={{ color: "#10b981", fontSize: "12px" }}>Profile updated!</p>}
        <Button type="submit" size="lg" fullWidth disabled={isPending}>{isPending ? "Saving..." : "Save Changes"}</Button>
      </form>
    </div>
  );
}
