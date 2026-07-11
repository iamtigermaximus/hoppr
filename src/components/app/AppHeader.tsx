"use client";
import { useState, useRef, useEffect } from "react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import styled from "styled-components";
import Image from "next/image";
import { Bell, MagnifyingGlass, User, Gear, SignOut } from "@phosphor-icons/react";
import { Avatar } from "@/components/ui/Avatar";
import { useMyProfile } from "@/hooks/useProfile";
import { useNotifications } from "@/hooks/useNotifications";

const Header = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0px 10px;
  background: var(--color-header-bg, #0a0a0a);
  /* border-bottom: 1px solid var(--color-header-border, #262626); */
  position: sticky;
  top: 0;
  z-index: 40;

  @media (min-width: 768px) {
    display: none;
  }
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  gap: 0 8px;
`;

const LogoIcon = styled.div`
  width: 50px;
  height: 32px;
  background: linear-gradient(135deg, #7c3aed, #5b21b6);
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const LogoText = styled.span`
  font-weight: 800;
  font-size: 16px;
  color: #fff;
  letter-spacing: -0.5px;
`;

const Actions = styled.div`
  display: flex;
  gap: 14px;
  align-items: center;
`;

const Dropdown = styled.div`
  position: absolute;
  top: 42px;
  right: 0;
  background: #1a1a1a;
  border: 1px solid #262626;
  border-radius: 12px;
  padding: 6px;
  min-width: 180px;
  z-index: 60;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
`;

const MenuItem = styled.button`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 13px;
  width: 100%;
  background: none;
  border: none;
  cursor: pointer;
  &:hover {
    background: #262626;
  }
`;

export function AppHeader() {
  const { data: session } = useSession();
  const user = session?.user;
  const { data: profile } = useMyProfile();
  const { data } = useNotifications();
  const notifications = data?.notifications ?? [];
  const unreadCount = notifications.filter((n: any) => !n.read).length;
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <Header>
      <Link href="/" style={{ textDecoration: "none" }}>
        <Logo>
          <Image
            src="/hoppr-neon-nobg.png"
            alt="Hoppr"
            width={80}
            height={65}
            priority
          />
        </Logo>
      </Link>
      <Link href="/search" style={{ display: "inline-flex", alignItems: "center" }}>
        <MagnifyingGlass size={20} color="#737373" />
      </Link>
      <Actions>
        <Link href="/notifications">
          <div style={{ position: "relative" }}>
            <Bell size={20} color="#737373" />
            {unreadCount > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: "-6px",
                  right: "-8px",
                  background: "#ef4444",
                  color: "#fff",
                  fontSize: "10px",
                  fontWeight: 700,
                  minWidth: "18px",
                  height: "18px",
                  borderRadius: "9px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "0 4px",
                }}
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </div>
        </Link>
        <div ref={menuRef} style={{ position: "relative" }}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              cursor: "pointer",
              background: "none",
              border: "none",
              padding: 0,
            }}
          >
            <Avatar
              src={profile?.image}
              name={profile?.username || user?.name || undefined}
              size={32}
            />
          </button>
          {menuOpen && (
            <Dropdown>
              <Link
                href="/profile/me"
                onClick={() => setMenuOpen(false)}
                style={{ textDecoration: "none" }}
              >
                <MenuItem
                  as="span"
                  style={{ color: "#a3a3a3", display: "flex" }}
                >
                  <User size={16} /> Profile
                </MenuItem>
              </Link>
              <Link
                href="/settings"
                onClick={() => setMenuOpen(false)}
                style={{ textDecoration: "none" }}
              >
                <MenuItem
                  as="span"
                  style={{ color: "#a3a3a3", display: "flex" }}
                >
                  <Gear size={16} /> Settings
                </MenuItem>
              </Link>
              <div
                style={{
                  height: "1px",
                  background: "#262626",
                  margin: "4px 0",
                }}
              />
              <MenuItem
                onClick={() => {
                  setMenuOpen(false);
                  signOut({ callbackUrl: "/login" });
                }}
                style={{ color: "#ef4444" }}
              >
                <SignOut size={16} /> Sign Out
              </MenuItem>
            </Dropdown>
          )}
        </div>
      </Actions>
    </Header>
  );
}
