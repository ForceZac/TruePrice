"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { getLocalRecentIds, clearLocalRecentIds } from "@/lib/recentlyViewedLocal";
import { mergeLocalRecent } from "@/lib/api";

/**
 * Invisible component mounted in the root layout.
 *
 * On sign-in, merges any localStorage recently-viewed product IDs into the
 * user's DB record (acceptance criterion 8 of Goal 10). Runs at most once per
 * authenticated session: after a successful merge the localStorage list is
 * cleared, so subsequent page loads are no-ops.
 */
export function PostSigninSync() {
  const { status } = useSession();
  const hasSynced = useRef(false);

  useEffect(() => {
    if (status !== "authenticated" || hasSynced.current) return;
    const localIds = getLocalRecentIds();
    if (localIds.length === 0) return;

    hasSynced.current = true;
    mergeLocalRecent(localIds)
      .then(() => clearLocalRecentIds())
      .catch(() => {
        // Allow a retry on the next render cycle if the request failed.
        hasSynced.current = false;
      });
  }, [status]);

  return null;
}
