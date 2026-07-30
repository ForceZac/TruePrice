"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CONSENT_KEY, CONSENT_EVENT } from "@/lib/consent";

type ConsentValue = "accepted" | "declined";

function saveConsent(value: ConsentValue) {
  localStorage.setItem(CONSENT_KEY, value);
  window.dispatchEvent(new Event(CONSENT_EVENT));
}

/**
 * Cookie consent banner.
 * Shown on first visit; stores choice in localStorage under `cookie_consent`.
 * Dispatches `cookie-consent-change` so AdSenseLoader can react.
 */
export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const existing = localStorage.getItem(CONSENT_KEY);
    if (!existing) setVisible(true);
  }, []);

  if (!visible) return null;

  const handleAccept = () => {
    saveConsent("accepted");
    setVisible(false);
  };

  const handleDecline = () => {
    saveConsent("declined");
    setVisible(false);
  };

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      aria-live="polite"
      className="fixed bottom-0 inset-x-0 z-50 p-4"
    >
      <div className="max-w-2xl mx-auto bg-card border border-border rounded-xl shadow-lg px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <p className="text-sm text-foreground flex-1">
          TruePrice uses cookies for ads (Google AdSense) to keep this site
          free.{" "}
          <Link href="/privacy" className="underline hover:text-foreground/80">
            Privacy Policy
          </Link>
        </p>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={handleDecline}
            className="px-4 py-2 text-sm rounded-lg border border-border bg-background text-foreground hover:bg-muted transition"
          >
            Decline
          </button>
          <button
            onClick={handleAccept}
            className="px-4 py-2 text-sm rounded-lg bg-foreground text-background hover:bg-foreground/90 transition"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
