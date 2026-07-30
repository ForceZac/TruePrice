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
});

const _clientEnv = clientEnvSchema.safeParse({
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_ADSENSE_CLIENT: process.env.NEXT_PUBLIC_ADSENSE_CLIENT,
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
