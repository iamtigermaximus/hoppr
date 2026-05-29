"use client";
import styled from "styled-components";

interface AvatarProps {
  src?: string | null;
  name?: string;
  size?: number;
}

export function Avatar({ src, name, size = 28 }: AvatarProps) {
  if (src) {
    return (
      <Circle
        $size={size}
        style={{
          backgroundImage: `url(${src})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
    );
  }
  const initials = (name || "U").slice(0, 2).toUpperCase();
  return (
    <Circle $size={size} $fallback>
      {initials}
    </Circle>
  );
}

const Circle = styled.div<{ $size: number; $fallback?: boolean }>`
  width: ${({ $size }) => $size}px;
  height: ${({ $size }) => $size}px;
  min-width: ${({ $size }) => $size}px;
  border-radius: 50%;
  border: 1px solid gray;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${({ $size }) => Math.max($size * 0.35, 9)}px;
  font-weight: 600;
  color: var(--color-text-secondary, #a3a3a3);
  background: ${({ $fallback }) => ($fallback ? "var(--color-card-border, #262626)" : "transparent")};
  position: relative;
  overflow: hidden;
`;
