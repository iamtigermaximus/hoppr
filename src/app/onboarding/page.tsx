"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";

export default function OnboardingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const onboardingCompleted = (session?.user as Record<string, unknown> | undefined)
    ?.onboardingCompleted as boolean | undefined;

  useEffect(() => {
    if (status === "authenticated" && onboardingCompleted === true) {
      router.replace("/home");
    }
  }, [status, onboardingCompleted, router]);

  // Don't flash the onboarding flow while checking session
  if (status === "loading") return null;

  return <OnboardingFlow />;
}
