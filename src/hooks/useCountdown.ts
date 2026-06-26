"use client";
import { useState, useEffect } from "react";

/**
 * Returns a human-readable countdown string like "2d 3h", "45m", or "Ended".
 * Updates every 60 seconds to keep the display fresh.
 */
export function useCountdown(targetDate: string | Date): string {
  const [label, setLabel] = useState<string>("");

  useEffect(() => {
    function tick() {
      const now = Date.now();
      const target = new Date(targetDate).getTime();
      const diff = target - now;

      if (diff <= 0) {
        setLabel("Ended");
        return;
      }

      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);

      if (days > 0) {
        setLabel(`${days}d ${hours}h`);
      } else if (hours > 0) {
        setLabel(`${hours}h ${minutes}m`);
      } else {
        setLabel(`${minutes}m`);
      }
    }

    tick();
    const interval = setInterval(tick, 60_000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return label;
}
