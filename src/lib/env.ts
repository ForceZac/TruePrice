/**
 * Unified environment re-export (backward compatibility shim).
 *
 * New code should import directly from the split modules:
 *   - Server components / API routes / services → @/lib/env.server
 *   - Client components / browser-bundled code  → @/lib/env.client
 *
 * This file merges both exports so existing server-side imports of
 * `import { env } from "@/lib/env"` continue to work without changes.
 * It is safe to import from server-side files only — it pulls in serverEnv
 * which validates DATABASE_URL and will throw in the browser.
 */

import { serverEnv } from "@/lib/env.server";
import { clientEnv } from "@/lib/env.client";

export const env = {
  ...serverEnv,
  ...clientEnv,
};
