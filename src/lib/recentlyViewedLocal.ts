/**
 * localStorage utilities for recently viewed product IDs.
 * Used to track product views for unauthenticated users so they can be
 * merged into the DB when the user signs in.
 */

const KEY = "tp:recentlyViewed";
const LOCAL_CAP = 20; // generous local cap; DB merges dedup + cap at 10

/**
 * Prepend a productId to the localStorage recently-viewed list.
 * Deduplicates and caps at LOCAL_CAP entries. No-op in SSR.
 */
export function addLocalRecentView(productId: string): void {
  if (typeof window === "undefined") return;
  try {
    const existing = getLocalRecentIds();
    const updated = [productId, ...existing.filter((id) => id !== productId)].slice(0, LOCAL_CAP);
    localStorage.setItem(KEY, JSON.stringify(updated));
  } catch {
    // localStorage unavailable (private browsing quota, etc.)
  }
}

/**
 * Return the list of recently-viewed product IDs stored locally.
 * Returns an empty array in SSR or on parse error.
 */
export function getLocalRecentIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === "string")
      : [];
  } catch {
    return [];
  }
}

/**
 * Remove the recently-viewed list from localStorage.
 * Called after a successful merge into the DB.
 */
export function clearLocalRecentIds(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
