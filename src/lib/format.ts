/**
 * Shared formatting utilities.
 * All monetary values are stored as integer cents; format them here for display.
 */

/** Format an integer cent amount as a USD dollar string (e.g. 299 → "$2.99"). */
export function centsToUsd(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(cents / 100);
}
