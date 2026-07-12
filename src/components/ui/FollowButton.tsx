"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import { Heart } from "@phosphor-icons/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { track } from "@/lib/analytics";
import { markEligibleForPushOptIn } from "@/lib/push-eligibility";
import { useInstallPromptContext } from "@/components/contexts/InstallPromptProvider";

// ---- Styled ----

const Button = styled.button<{ $following: boolean; $isLoading: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: ${({ $isLoading }) => ($isLoading ? "wait" : "pointer")};
  transition: all 0.15s;
  border: 1px solid
    ${({ $following }) => ($following ? "#7c3aed" : "var(--color-card-border, #262626)")};
  background: ${({ $following }) =>
    $following ? "#7c3aed15" : "transparent"};
  color: ${({ $following }) =>
    $following ? "#7c3aed" : "var(--color-text-secondary, #a3a3a3)"};
  opacity: ${({ $isLoading }) => ($isLoading ? 0.7 : 1)};

  &:hover {
    border-color: #7c3aed;
    color: #7c3aed;
    background: #7c3aed10;
  }
`;

// ---- Types ----

interface FollowButtonProps {
  barId: string;
  /** Optional pre-fetched follower count */
  initialFollowerCount?: number;
  /** Optional pre-fetched follow state */
  initialIsFollowing?: boolean;
  /** Compact variant (icon only) for cards */
  compact?: boolean;
}

// ---- Component ----

export function FollowButton({
  barId,
  initialFollowerCount = 0,
  initialIsFollowing = false,
  compact = false,
}: FollowButtonProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { showBanner } = useInstallPromptContext();
  const [optimistic, setOptimistic] = useState<{
    following: boolean;
    count: number;
  } | null>(null);

  const { data } = useQuery({
    queryKey: ["follow", barId],
    queryFn: () => fetch(`/api/bars/${barId}/follow`).then((r) => r.json()),
    placeholderData: {
      isFollowing: initialIsFollowing,
      followerCount: initialFollowerCount,
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  const isFollowing = optimistic?.following ?? data?.isFollowing ?? false;
  const followerCount = optimistic?.count ?? data?.followerCount ?? 0;

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (!session?.user) {
      router.push("/login");
      return;
    }

    // Optimistic update
    const newFollowing = !isFollowing;
    setOptimistic({
      following: newFollowing,
      count: followerCount + (newFollowing ? 1 : -1),
    });

    try {
      const res = await fetch(`/api/bars/${barId}/follow`, {
        method: newFollowing ? "POST" : "DELETE",
      });

      if (res.ok) {
        const json = await res.json();
        setOptimistic(null);
        queryClient.setQueryData(["follow", barId], {
          isFollowing: json.following,
          followerCount: json.following
            ? followerCount + (isFollowing ? 0 : 1)
            : followerCount - (isFollowing ? 1 : 0),
        });
        // Track the follow/unfollow event
        track({
          type: newFollowing ? "FOLLOW" : "UNFOLLOW",
          barId,
        });
        // Following a bar is a strong signal of engagement —
        // make the user eligible for push notification opt-in
        if (newFollowing) {
          markEligibleForPushOptIn();
          // Following is a strong intent signal — suggest installing the app
          showBanner();
        }
      } else {
        // Revert on error
        setOptimistic(null);
      }
    } catch {
      setOptimistic(null);
    }
  };

  return (
    <Button
      $following={isFollowing}
      $isLoading={false}
      onClick={handleToggle}
      aria-label={isFollowing ? "Unfollow this bar" : "Follow this bar"}
    >
      <Heart
        size={14}
        weight={isFollowing ? "fill" : "regular"}
      />
      {!compact && (
        <>
          {isFollowing ? "Following" : "Follow"}
          {followerCount > 0 && (
            <span style={{ opacity: 0.6, fontSize: "10px" }}>
              {followerCount}
            </span>
          )}
        </>
      )}
    </Button>
  );
}
