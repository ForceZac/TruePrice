/**
 * Server-only environment variables.
 *
 * IMPORTANT: Import ONLY from server-side code (API routes, server components,
 * services, and middleware). Never import this module from files that may be
 * bundled for the browser — Next.js will bundle anything reachable from a
 * "use client" component, even transitively.
 *
 * For environment variables safe to use in the browser, see @/lib/env.client.
 *
 * If the `server-only` package is ever added as a dependency, add
 * `import "server-only"` at the top of this file to enforce the restriction
 * at build time rather than relying on convention alone.
 */

import { z } from "zod";

const serverEnvSchema = z.object({
  // Database
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  // External APIs (optional in dev)
  COMMODITY_API_KEY: z.string().optional(),
  UPCITEMDB_API_KEY: z.string().optional(),
  GO_UPC_API_KEY: z.string().optional(),

  // Observability (optional in dev)
  SENTRY_DSN: z.string().optional(),
  GOOGLE_ANALYTICS_ID: z.string().optional(),
  ADSENSE_PUBLISHER_ID: z.string().optional(),
  POSTHOG_API_KEY: z.string().optional(),

  // Cron job protection
  CRON_SECRET: z.string().optional(),

  // Re-estimation TTL: days after which a CostBreakdown is re-computed (default 7)
  RE_ESTIMATION_TTL_DAYS: z.coerce.number().int().positive().default(7),

  // Auth (NextAuth v5)
  NEXTAUTH_SECRET: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  // Email (Resend) — weekly digest
  RESEND_API_KEY: z.string().optional(),
  FROM_EMAIL: z.string().default("digest@trueprice.app"),

  // CI / Bots (optional in dev)
  GITHUB_TOKEN: z.string().optional(),
  DISCORD_BOT_TOKEN: z.string().optional(),

  // Runtime
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
});

const _serverEnv = serverEnvSchema.safeParse(process.env);

if (!_serverEnv.success) {
  console.error(
    "Invalid server environment variables:",
    _serverEnv.error.flatten().fieldErrors
  );
  throw new Error(
    "Invalid server environment variables. Check your .env.local file."
  );
}

export const serverEnv = _serverEnv.data;
