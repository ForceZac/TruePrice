/** Valid explicit alert threshold values (percentage points). */
export const VALID_THRESHOLDS = [0, 5, 10, 20] as const;
export type AlertThreshold = (typeof VALID_THRESHOLDS)[number];
