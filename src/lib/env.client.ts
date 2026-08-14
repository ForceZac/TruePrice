/**
 * Client-safe environment variables.
 *
 * Only NEXT_PUBLIC_ variables belong here — Next.js inlines these at build
 * time so they are safe to import from any file, including client components
 * and browser-bundled code.
 *
 * Server-only variables (DATABASE_URL, API keys, etc.) live in
 * @/lib/env.server. Never add non-NEXT_PUBLIC_ variables here.
 */

import { z } from "zod";

const clientEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_ADSENSE_CLIENT: z.string().optional(),
  // AdSense ad unit slot IDs (numeric IDs from the AdSense dashboard).
  // Set these after AdSense account is approved — placeholder strings won't serve real ads.
  NEXT_PUBLIC_ADSENSE_SLOT_PRODUCT: z.string().optional(),
  NEXT_PUBLIC_ADSENSE_SLOT_CATEGORY: z.string().optional(),
  // Google Search Console HTML-meta verification token (Q14-2).
  // Set this to the value from Google Search Console → "HTML tag" verification method.
  NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION: z.string().optional(),
});

const _clientEnv = clientEnvSchema.safeParse({
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_ADSENSE_CLIENT: process.env.NEXT_PUBLIC_ADSENSE_CLIENT,
  NEXT_PUBLIC_ADSENSE_SLOT_PRODUCT: process.env.NEXT_PUBLIC_ADSENSE_SLOT_PRODUCT,
  NEXT_PUBLIC_ADSENSE_SLOT_CATEGORY: process.env.NEXT_PUBLIC_ADSENSE_SLOT_CATEGORY,
  NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
});

if (!_clientEnv.success) {
  console.error(
    "Invalid client environment variables:",
    _clientEnv.error.flatten().fieldErrors
  );
  throw new Error(
    "Invalid client environment variables. Check your .env.local file."
  );
}

export const clientEnv = _clientEnv.data;
