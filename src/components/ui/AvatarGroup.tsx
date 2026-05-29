"use client";
import styled from "styled-components";
import { Avatar } from "./Avatar";

interface User { id: string; name?: string | null; image?: string | null; }

export function AvatarGroup({ users, max = 5, size = 28 }: { users: User[]; max?: number; size?: number }) {
  const visible = users.slice(0, max);
  const overflow = users.length - max;
  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      {visible.map((u, i) => (
        <div key={u.id} style={{ marginRight: `-${size * 0.3}px`, zIndex: visible.length - i }}>
          <Avatar src={u.image} name={u.name || undefined} size={size} />
        </div>
      ))}
      {overflow > 0 && (
        <CountBadge $size={size}>+{overflow}</CountBadge>
      )}
    </div>
  );
}

const CountBadge = styled.div<{ $size: number }>`
  width: ${({ $size }) => $size}px;
  height: ${({ $size }) => $size}px;
  min-width: ${({ $size }) => $size}px;
  border-radius: 50%;
  border: 2px solid var(--color-card, #1a1a1a);
  background: var(--color-card-border, #262626);
  display: flex; align-items: center; justify-content: center;
  font-size: ${({ $size }) => Math.max($size * 0.35, 9)}px;
  font-weight: 600;
  color: var(--color-text-secondary, #a3a3a3);
  margin-left: 4px;
`;
