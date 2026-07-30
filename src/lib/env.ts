import { z } from "zod";

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  // App
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),

  // External APIs (optional in dev)
  COMMODITY_API_KEY: z.string().optional(),
  UPCITEMDB_API_KEY: z.string().optional(),
  GO_UPC_API_KEY: z.string().optional(),

  // Observability (optional in dev)
  SENTRY_DSN: z.string().optional(),
  GOOGLE_ANALYTICS_ID: z.string().optional(),
  ADSENSE_PUBLISHER_ID: z.string().optional(),
  NEXT_PUBLIC_ADSENSE_CLIENT: z.string().optional(),
  POSTHOG_API_KEY: z.string().optional(),

  // CI / Bots (optional in dev)
  GITHUB_TOKEN: z.string().optional(),
  DISCORD_BOT_TOKEN: z.string().optional(),

  // Runtime
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error("Invalid environment variables:", _env.error.flatten().fieldErrors);
  throw new Error("Invalid environment variables. Check your .env.local file.");
}

export const env = _env.data;
