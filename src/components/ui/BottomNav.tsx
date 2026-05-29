"use client";
import styled from "styled-components";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { signOut, useSession } from "next-auth/react";
import { House, MagnifyingGlass, Plus, ChatCircle, User, Bell, Gear, SignOut as SignOutIcon } from "@phosphor-icons/react";
import { Avatar } from "@/components/ui/Avatar";
import { useMyProfile } from "@/hooks/useProfile";
import { useNotifications } from "@/hooks/useNotifications";
import { useState, useRef, useEffect } from "react";

const Nav = styled.nav`
  position: fixed; bottom: 0; left: 0; right: 0; z-index: 50;
  background: var(--color-header-bg, #0a0a0a);
  border-top: 1px solid var(--color-header-border, #262626);
  padding: 8px 20px env(safe-area-inset-bottom, 8px) 20px;
  display: flex; justify-content: space-around; align-items: center;

  @media (min-width: 768px) {
    top: 0; bottom: auto; left: 0; right: 0;
    height: 56px;
    flex-direction: row;
    justify-content: space-between;
    gap: 0;
    border-top: none;
    border-bottom: 1px solid var(--color-header-border, #262626);
    padding: 0 24px;
  }
`;

const NavLeft = styled.div`
  display: none;
  @media (min-width: 768px) { display: flex; align-items: center; gap: 32px; }
`;

const NavCenter = styled.div`
  display: none;
  @media (min-width: 768px) { display: flex; align-items: center; gap: 4px; }
`;

const NavRight = styled.div`
  display: none;
  @media (min-width: 768px) { display: flex; align-items: center; gap: 16px; }
`;

const NavItem = styled(Link)<{ $active: boolean }>`
  display: flex; flex-direction: column; align-items: center; gap: 3px;
  color: ${({ $active }) => $active ? "#7c3aed" : "var(--color-text-muted, #737373)"};
  transition: color 0.15s;
  min-width: 48px; min-height: 48px; justify-content: center;
  text-decoration: none;
  span { font-size: 10px; font-weight: ${({ $active }) => $active ? 600 : 500}; }
  &:hover { color: ${({ $active }) => $active ? "#7c3aed" : "var(--color-text-secondary, #a3a3a3)"}; }

  @media (min-width: 768px) {
    flex-direction: row; gap: 6px;
    min-width: unset; min-height: unset;
    padding: 8px 14px; border-radius: 10px;
    background: ${({ $active }) => $active ? "rgba(124,58,237,0.1)" : "transparent"};
    span { font-size: 13px; font-weight: ${({ $active }) => $active ? 600 : 500}; }
    &:hover { background: rgba(255,255,255,0.05); }
  }
`;

const FAB = styled(Link)`
  width: 48px; height: 48px;
  background: linear-gradient(135deg, #7c3aed, #5b21b6);
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  margin-top: -20px;
  box-shadow: 0 4px 20px rgba(124,58,237,0.5);
  transition: transform 0.15s, box-shadow 0.15s;
  text-decoration: none;
  &:hover { transform: scale(1.05); box-shadow: 0 6px 24px rgba(124,58,237,0.6); }

  @media (min-width: 768px) {
    margin-top: 0; width: auto; height: auto; border-radius: 10px;
    padding: 8px 18px; box-shadow: none; gap: 6px; font-size: 13px;
    font-weight: 600; color: #fff; display: inline-flex;
    &:hover { transform: none; box-shadow: 0 4px 16px rgba(124,58,237,0.3); }
    &::after { content: "Create"; }
  }
`;

const Dropdown = styled.div`
  position: absolute; top: 48px; right: 0;
  background: var(--color-card, #1a1a1a); border: 1px solid var(--color-card-border, #262626); border-radius: 12px;
  padding: 6px; min-width: 180px; z-index: 60;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
`;

const MenuItem = styled.button`
  display: flex; align-items: center; gap: 10px;
  padding: 10px 12px; border-radius: 8px;
  font-size: 13px; width: 100%;
  background: none; border: none; cursor: pointer; color: var(--color-text-secondary, #a3a3a3);
  &:hover { background: var(--color-card-border, #262626); }
`;

const tabs = [
  { href: "/home", label: "Home", icon: House },
  { href: "/discover", label: "Discover", icon: MagnifyingGlass },
  { href: "/events/create", label: "Create", icon: Plus, isFab: true },
  { href: "/chat", label: "Chat", icon: ChatCircle },
  { href: "/profile/me", label: "Profile", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { data: profile } = useMyProfile();
  const { data: notifications = [] } = useNotifications();
  const unreadCount = Array.isArray(notifications) ? notifications.filter((n: any) => !n.isRead).length : 0;
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (pathname === "/login" || pathname === "/register" || pathname === "/onboarding") return null;

  return (
    <Nav>
      {/* Desktop: Logo */}
      <NavLeft>
        <Link href="/home" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
          <Image src="/hoppr-neon-nobg.png" alt="Hoppr" width={160} height={56} style={{ objectFit: "contain", minWidth: "140px" }} />
        </Link>
      </NavLeft>

      {/* Desktop: Nav items */}
      <NavCenter>
        {tabs.map(({ href, label, icon: Icon, isFab }) => {
          const active = pathname === href || (href !== "/" && href !== "/home" && pathname.startsWith(href));
          if (isFab) {
            return (
              <FAB key={href} href={href}>
                <Plus size={20} weight="bold" color="#fff" />
              </FAB>
            );
          }
          return (
            <NavItem key={href} href={href} $active={active}>
              <Icon size={20} weight={active ? "bold" : "regular"} />
              <span>{label}</span>
            </NavItem>
          );
        })}
      </NavCenter>

      {/* Desktop: Bell + Avatar */}
      <NavRight>
        <Link href="/notifications" style={{ position: "relative" }}>
          <Bell size={22} color="var(--color-text-muted, #737373)" />
          {unreadCount > 0 && (
            <span style={{ position: "absolute", top: "-6px", right: "-8px", background: "#ef4444", color: "#fff", fontSize: "10px", fontWeight: 700, minWidth: "18px", height: "18px", borderRadius: "9px", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px" }}>
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Link>
        <div ref={menuRef} style={{ position: "relative" }}>
          <button onClick={() => setMenuOpen(!menuOpen)} style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}>
            <Avatar src={profile?.avatarUrl} name={profile?.username || session?.user?.name || undefined} size={34} />
          </button>
          {menuOpen && (
            <Dropdown>
              <Link href="/profile/me" onClick={() => setMenuOpen(false)} style={{ textDecoration: "none" }}>
                <MenuItem as="span"><User size={16} /> Profile</MenuItem>
              </Link>
              <Link href="/settings" onClick={() => setMenuOpen(false)} style={{ textDecoration: "none" }}>
                <MenuItem as="span"><Gear size={16} /> Settings</MenuItem>
              </Link>
              <div style={{ height: "1px", background: "var(--color-card-border, #262626)", margin: "4px 0" }} />
              <MenuItem onClick={() => { setMenuOpen(false); signOut({ callbackUrl: "/login" }); }} style={{ color: "#ef4444" }}>
                <SignOutIcon size={16} /> Sign Out
              </MenuItem>
            </Dropdown>
          )}
        </div>
      </NavRight>

      {/* Mobile: Bottom nav items */}
      <MobileOnly>
        {tabs.map(({ href, label, icon: Icon, isFab }) => {
          const active = pathname === href || (href !== "/" && href !== "/home" && pathname.startsWith(href));
          if (isFab) {
            return <FAB key={href} href={href}><Plus size={24} weight="bold" color="#fff" /></FAB>;
          }
          return (
            <NavItem key={href} href={href} $active={active}>
              <Icon size={24} weight={active ? "bold" : "regular"} />
              <span>{label}</span>
            </NavItem>
          );
        })}
      </MobileOnly>
    </Nav>
  );
}

const MobileOnly = styled.div`
  display: flex; justify-content: space-around; align-items: center; width: 100%;
  @media (min-width: 768px) { display: none; }
`;
