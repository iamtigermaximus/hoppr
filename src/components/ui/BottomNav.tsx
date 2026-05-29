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

const SidebarLogo = styled(Link)`
  display: none;
  @media (min-width: 768px) {
    display: flex; flex-direction: column; align-items: center; gap: 4px;
    text-decoration: none; margin-bottom: 8px;
    position: absolute; top: 20px;
  }
`;

const DesktopActions = styled.div`
  display: none;
  @media (min-width: 768px) {
    display: flex; flex-direction: column; align-items: center; gap: 20px;
    position: absolute; bottom: 20px;
  }
`;

const DesktopBell = styled(Link)`
  position: relative;
  @media (min-width: 768px) { display: flex; }
`;

const DesktopAvatar = styled.div`position: relative;`;

const Dropdown = styled.div`
  position: absolute; bottom: 48px; left: 50%; transform: translateX(-50%);
  background: #1a1a1a; border: 1px solid #262626; border-radius: 12px;
  padding: 6px; min-width: 180px; z-index: 60;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
`;

const MenuItem = styled.button`
  display: flex; align-items: center; gap: 10px;
  padding: 10px 12px; border-radius: 8px;
  font-size: 13px; width: 100%;
  background: none; border: none; cursor: pointer; color: #a3a3a3;
  &:hover { background: #262626; }
`;

const Nav = styled.nav`
  position: fixed; bottom: 0; left: 0; right: 0; z-index: 50;
  background: #0a0a0a; border-top: 1px solid #262626;
  padding: 8px 20px env(safe-area-inset-bottom, 8px) 20px;
  display: flex; justify-content: space-around; align-items: center;

  @media (min-width: 768px) {
    top: 0; bottom: 0; left: 0; right: auto;
    width: 72px;
    flex-direction: column;
    justify-content: center;
    gap: 24px;
    border-top: none;
    border-right: 1px solid #262626;
    padding: 20px 0;
  }
`;

const NavItem = styled(Link)<{ $active: boolean }>`
  display: flex; flex-direction: column; align-items: center; gap: 3px;
  color: ${({ $active }) => $active ? "#7c3aed" : "#737373"};
  transition: color 0.15s;
  min-width: 48px; min-height: 48px; justify-content: center;
  text-decoration: none;
  span { font-size: 10px; font-weight: ${({ $active }) => $active ? 600 : 500}; }
  &:hover { color: ${({ $active }) => $active ? "#7c3aed" : "#a3a3a3"}; }

  @media (min-width: 768px) {
    span { display: none; }
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
    margin-top: 0;
    width: 44px; height: 44px;
  }
`;

const tabs = [
  { href: "/", label: "Home", icon: House },
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

  if (pathname === "/login" || pathname === "/register" || pathname === "/onboarding") {
    return null;
  }

  return (
    <Nav>
      <SidebarLogo href="/">
        <Image src="/hoppr-neon-nobg.png" alt="Hoppr" width={40} height={40} />
      </SidebarLogo>

      {tabs.map(({ href, label, icon: Icon, isFab }) => {
        const active = pathname === href || (href !== "/" && pathname.startsWith(href));
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

      {/* Desktop-only: notification bell + avatar at bottom of sidebar */}
      <DesktopActions>
        <DesktopBell href="/notifications">
          <Bell size={22} color="#737373" />
          {unreadCount > 0 && (
            <span style={{
              position: "absolute", top: "-6px", right: "-8px",
              background: "#ef4444", color: "#fff",
              fontSize: "10px", fontWeight: 700,
              minWidth: "18px", height: "18px", borderRadius: "9px",
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: "0 4px",
            }}>
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </DesktopBell>

        <DesktopAvatar ref={menuRef}>
          <button onClick={() => setMenuOpen(!menuOpen)} style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}>
            <Avatar src={profile?.avatarUrl} name={profile?.username || session?.user?.name || undefined} size={32} />
          </button>
          {menuOpen && (
            <Dropdown>
              <Link href="/profile/me" onClick={() => setMenuOpen(false)} style={{ textDecoration: "none" }}>
                <MenuItem as="span"><User size={16} /> Profile</MenuItem>
              </Link>
              <Link href="/settings" onClick={() => setMenuOpen(false)} style={{ textDecoration: "none" }}>
                <MenuItem as="span"><Gear size={16} /> Settings</MenuItem>
              </Link>
              <div style={{ height: "1px", background: "#262626", margin: "4px 0" }} />
              <MenuItem onClick={() => { setMenuOpen(false); signOut({ callbackUrl: "/login" }); }} style={{ color: "#ef4444" }}>
                <SignOutIcon size={16} /> Sign Out
              </MenuItem>
            </Dropdown>
          )}
        </DesktopAvatar>
      </DesktopActions>
    </Nav>
  );
}
