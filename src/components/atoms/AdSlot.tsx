"use client";

import { useEffect, useRef } from "react";

interface AdSlotProps {
  /** AdSense ad unit slot ID */
  slotId: string;
  /** Ad format — auto for responsive, rectangle or leaderboard for fixed units */
  format?: "auto" | "rectangle" | "leaderboard";
  className?: string;
}

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

export function AdSlot({ slotId, format = "auto", className }: AdSlotProps) {
  const pushed = useRef(false);

  useEffect(() => {
    if (pushed.current) return;
    pushed.current = true;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // AdSense not loaded yet (dev environment or consent not given)
    }
  }, []);

  // Min-height varies by format to prevent CLS
  const minHeight =
    format === "leaderboard" ? "min-h-[90px]" : "min-h-[250px]";

  return (
    <div className={`w-full ${minHeight} ${className ?? ""}`}>
      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
        Advertisement
      </p>
      <ins
        className="adsbygoogle block"
        style={{ display: "block" }}
        data-ad-slot={slotId}
        data-ad-format={format === "auto" ? "auto" : undefined}
        data-full-width-responsive={format === "auto" ? "true" : undefined}
      />
    </div>
  );
}
