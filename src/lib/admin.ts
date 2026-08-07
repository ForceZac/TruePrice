/**
 * Admin auth helper.
 *
 * Admin status is controlled by the ADMIN_EMAILS env var (comma-separated
 * list of email addresses). This avoids a schema migration for v1 — env var
 * is simpler when there's a single admin (Zach).
 */

import { serverEnv } from "@/lib/env.server";

/**
 * Returns true if the given email address appears in ADMIN_EMAILS.
 * Returns false if ADMIN_EMAILS is not set or the email is null/undefined.
 */
export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  const adminEmails = serverEnv.ADMIN_EMAILS;
  if (!adminEmails) return false;
  return adminEmails
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .includes(email.toLowerCase());
}
