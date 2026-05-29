"use client";
import styled, { keyframes } from "styled-components";
import { FeedCard } from "./FeedCard";
import { Compass } from "@phosphor-icons/react";
import type { FeedItem } from "@/types/feed";

const shimmer = keyframes`
  0% { opacity: 0.4; }
  50% { opacity: 0.7; }
  100% { opacity: 0.4; }
`;

const Skeleton = styled.div`
  background: #1a1a1a;
  border: 1px solid #262626;
  border-radius: 16px;
  padding: 16px;
  display: flex; gap: 12px;
  animation: ${shimmer} 1.8s ease-in-out infinite;
`;

const SkeletonCircle = styled.div`
  width: 52px; height: 52px;
  border-radius: 14px;
  background: #262626;
  flex-shrink: 0;
`;

const SkeletonLines = styled.div`
  flex: 1; display: flex; flex-direction: column; gap: 8px;
`;

const SkeletonLine = styled.div<{ $w: string }>`
  height: 12px; border-radius: 6px;
  background: #262626; width: ${({ $w }) => $w};
`;

const EmptyState = styled.div`
  text-align: center; padding: 64px 24px;
  display: flex; flex-direction: column; align-items: center;
`;

const List = styled.div`
  display: flex; flex-direction: column; gap: 10px;
  padding: 0;

  @media (min-width: 768px) {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }

  @media (min-width: 1200px) {
    grid-template-columns: 1fr 1fr 1fr;
  }
`;

export function FeedList({ items, isLoading }: { items: FeedItem[]; isLoading: boolean }) {
  if (isLoading) {
    return (
      <List>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i}>
            <SkeletonCircle />
            <SkeletonLines>
              <SkeletonLine $w="30%" />
              <SkeletonLine $w="75%" />
              <SkeletonLine $w="50%" />
            </SkeletonLines>
          </Skeleton>
        ))}
      </List>
    );
  }

  if (!items.length) {
    return (
      <EmptyState>
        <Compass size={48} color="#737373" weight="regular" style={{ marginBottom: "14px" }} />
        <div style={{ color: "#a3a3a3", fontSize: "15px", fontWeight: 600, marginBottom: "4px" }}>
          Nothing nearby right now
        </div>
        <div style={{ color: "#737373", fontSize: "12px" }}>
          Try a different time filter or check back later
        </div>
      </EmptyState>
    );
  }

  return (
    <List>
      {items.map((item) => (
        <FeedCard key={`${item.type}-${item.id}`} item={item} />
      ))}
    </List>
  );
}
