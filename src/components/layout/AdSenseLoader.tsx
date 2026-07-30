"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { CONSENT_KEY, CONSENT_EVENT } from "@/lib/consent";

interface AdSenseLoaderProps {
  publisherId: string;
}

/**
 * Conditionally loads the AdSense auto-ads script based on cookie consent.
 * Re-evaluates when the user accepts or declines via the CookieConsent banner.
 */
export function AdSenseLoader({ publisherId }: AdSenseLoaderProps) {
  const [consent, setConsent] = useState<string | null>(null);

  useEffect(() => {
    setConsent(localStorage.getItem(CONSENT_KEY));

    const handleChange = () => {
      setConsent(localStorage.getItem(CONSENT_KEY));
    };
    window.addEventListener(CONSENT_EVENT, handleChange);
    return () => window.removeEventListener(CONSENT_EVENT, handleChange);
  }, []);

  if (consent !== "accepted") return null;

  // Note: revoking consent (setting consent to "declined") removes this
  // component from the React tree, but the AdSense <script> DOM node remains
  // active for the remainder of the session. The script stops loading on the
  // next full page reload. This is a known v1 limitation.
  return (
    <Script
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisherId}`}
      crossOrigin="anonymous"
      strategy="afterInteractive"
    />
  );
}
