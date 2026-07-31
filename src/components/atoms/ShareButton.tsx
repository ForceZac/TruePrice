"use client";

import { useState } from "react";
import { Share2, Check } from "lucide-react";

interface Props {
  url: string;
  title?: string;
  text?: string;
  label?: string;
}

/**
 * Shares `url` via the native Web Share API when available (mobile),
 * and falls back to clipboard copy on desktop.
 */
export function ShareButton({ url, title, text, label = "Share" }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleClick() {
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({ url, title, text });
        return;
      } catch {
        // User cancelled or share failed — fall through to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API unavailable (e.g. non-HTTPS dev) — silent fallback
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground shadow-sm hover:bg-muted transition"
      aria-label={copied ? "Link copied!" : `Share ${label}`}
    >
      {copied ? (
        <Check className="h-4 w-4 text-emerald-500" aria-hidden="true" />
      ) : (
        <Share2 className="h-4 w-4" aria-hidden="true" />
      )}
      {copied ? "Copied!" : label}
    </button>
  );
}
