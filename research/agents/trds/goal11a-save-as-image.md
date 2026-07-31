# TRD: Goal 11a — Save as Image

- **status:** `done`
- **goal:** `Goal 11a` (sub-feature of Goal 11 — Price Alerts & Save-as-Image)
- **priority:** `P2`
- **branch:** `task/goal11a-save-as-image`
- **estimated_effort:** `Small`
- **depends_on:** `Goal 5` (CostBreakdownChart must exist)
- **blocks:** nothing

## Description

Add a "Save as Image" button to the product page cost breakdown section. Clicking it captures the cost breakdown chart (donut + summary table + key stats) as a 2× PNG and triggers a browser download. Works for signed-out users — no auth check.

This is the client-side-only sub-feature extracted from Goal 11 (Price Alerts & Save-as-Image). It has no dependency on Goal 10 (User Accounts) and can ship independently.

## Acceptance Criteria

- [x] "Save as Image" button appears on the product page cost breakdown section
- [x] Clicking "Save as Image" downloads a PNG of the cost breakdown chart without a page reload
- [x] PNG is captured at 2× pixel density (Retina-aware)
- [x] Filename follows the pattern `trueprice-{product-slug}.png`
- [x] Button works for signed-out users (no auth check)
- [x] `dom-to-image-more` is lazy-loaded on click only (not bundled in initial page load)
- [x] TypeScript compiles clean
- [x] Unit tests cover: renders button, no-op when ref is null, calls toPng with scale 2, correct filename

## Tasks

- [x] Create `src/components/atoms/SaveAsImageButton.tsx` client component
- [x] Lazy-import `dom-to-image-more` inside click handler (not top-level)
- [x] Implement `toSlug` helper to sanitize product name for filename
- [x] Add `chartCaptureRef` wrapper div in `ProductPageClient` around stat-cards + chart
- [x] Wire `SaveAsImageButton` into the product page action bar
- [x] Write unit tests: renders, null-ref no-op, toPng scale 2, filename slug, special chars, error resilience
- [x] Verify tsc compiles clean

## Implementation Notes

- **New component:** `src/components/atoms/SaveAsImageButton.tsx` — client component; receives `chartRef: RefObject<HTMLElement | null>` and `productName: string`
- **Library:** `dom-to-image-more` (MIT license — confirmed compatible with commercial use)
- **Capture target:** a wrapper `<div ref={chartRef}>` placed around the stat-cards grid + `CostBreakdownChart` section in `ProductPageClient`
- **Download trigger:** `toPng(node, { scale: 2 })` → assign data URL to `<a download="trueprice-{slug}.png">` → `a.click()`
- **Bundle impact:** ~45 kB gzipped; mitigated by lazy import inside the click handler

## New Dependencies

- `dom-to-image-more` — client-side DOM-to-PNG capture (MIT)
