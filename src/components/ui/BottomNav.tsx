"use client";
import styled from "styled-components";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { House, MagnifyingGlass, Plus, ChatCircle, User } from "@phosphor-icons/react";

const SidebarLogo = styled(Link)`
  display: none;
  @media (min-width: 768px) {
    display: flex; flex-direction: column; align-items: center; gap: 4px;
    text-decoration: none; margin-bottom: 8px;
    position: absolute; top: 20px;
  }
`;

const LogoIcon = styled.div`
  width: 36px; height: 36px;
  background: linear-gradient(135deg, #7c3aed, #5b21b6);
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
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

  // Hide on auth pages
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
    </Nav>
  );
}
