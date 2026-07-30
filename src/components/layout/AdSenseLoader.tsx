"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

const CONSENT_KEY = "cookie_consent";
const CONSENT_EVENT = "cookie-consent-change";

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

  return (
    <Script
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisherId}`}
      crossOrigin="anonymous"
      strategy="afterInteractive"
    />
  );
}
