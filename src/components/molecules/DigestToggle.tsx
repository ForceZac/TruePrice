"use client";

import { useState, useTransition } from "react";

interface DigestToggleProps {
  initialEnabled: boolean;
}

/**
 * Client sub-component for the weekly digest toggle on the settings page.
 * Calls PATCH /api/account/preferences to persist changes.
 */
export function DigestToggle({ initialEnabled }: DigestToggleProps) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleToggle() {
    const next = !enabled;
    setError(null);

    startTransition(async () => {
      const res = await fetch("/api/account/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ digestEnabled: next }),
      });

      if (!res.ok) {
        setError("Failed to update preference. Please try again.");
        return;
      }

      const data = (await res.json()) as { digestEnabled: boolean };
      setEnabled(data.digestEnabled);
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium">Weekly Digest</span>
          <span className="text-xs text-muted-foreground">
            Receive a weekly email with your watchlist and top-marked-up products.
          </span>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          disabled={isPending}
          onClick={handleToggle}
          className={[
            "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent",
            "transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2",
            "focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            enabled ? "bg-primary" : "bg-input",
          ].join(" ")}
        >
          <span
            aria-hidden="true"
            className={[
              "pointer-events-none inline-block h-5 w-5 rounded-full bg-background shadow-lg ring-0",
              "transition duration-200 ease-in-out",
              enabled ? "translate-x-5" : "translate-x-0",
            ].join(" ")}
          />
        </button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
