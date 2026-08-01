# PRD: Goal 11a — Save as Image

- **Goal reference:** Goal 11a (sub-feature of Goal 11 — Price Alerts & Save-as-Image)
- **Status:** In review (PR #19)
- **Priority:** P2
- **Depends on:** Goal 5 (CostBreakdownChart)
- **Blocks:** nothing

---

## Problem Statement

After seeing the markup breakdown on a product page, users have a strong impulse to share it — "look how much this is actually worth." The web share API and copy-link patterns are weak for this use case: what people want to send is the chart itself, not a URL that requires the recipient to click through.

We already added OG images for social sharing in Goal 9, but those are static snapshots served at share time. A user who wants to show someone exactly what they're looking at right now — with the specific numbers on screen — has no good path. They'd have to take a manual screenshot, crop it, and share it. The "Save as Image" button removes that friction: one click, the chart lands in Downloads, ready to share.

---

## User Stories

- **As a deal-conscious shopper**, I want to save the cost breakdown chart as an image so I can send it to friends or post it on social media without having to screenshot and crop.
- **As a casual visitor (not logged in)**, I want the save button to work without creating an account — I shouldn't have to sign up to share a fact.
- **As a mobile user**, I want the downloaded image to look sharp on Retina/high-DPI screens so it doesn't look blurry when shared.
- **As a user on a slow connection**, I don't want the save button to slow down the initial page load — it should only load its dependency when I click it.

---

## Requirements

### Must Have
- "Save as Image" button on the product page cost breakdown section
- Button downloads a PNG of the chart section (stat cards + donut chart) — no page reload
- PNG is captured at 2× pixel density (Retina-aware)
- Filename follows the pattern `trueprice-{product-slug}.png`
- Works for signed-out users (no auth check)
- Library is lazy-loaded on click only — no bundle weight added to initial page load

### Should Have
- Button shows a loading/saving state while the PNG is being generated
- Graceful error handling if capture fails (no crash; silent fail acceptable)

### Won't Have (v1)
- Server-side PNG generation (client-side is sufficient; server rendering adds infra complexity)
- Video or GIF capture
- Custom branding overlay (watermark) on exported images
- Direct-to-clipboard copy (browser API inconsistencies across mobile)

---

## Acceptance Criteria

- [ ] "Save as Image" button is visible on the product page cost breakdown section
- [ ] Clicking the button downloads a PNG file to the user's device without a page reload
- [ ] Downloaded PNG is at 2× scale (Retina-aware)
- [ ] Filename follows `trueprice-{product-slug}.png` pattern
- [ ] Button works for unauthenticated users
- [ ] `dom-to-image-more` is NOT included in initial JS bundle (lazy-loaded on click)
- [ ] TypeScript compiles clean
- [ ] Unit tests cover: renders button, no-op when ref is null, calls toPng with scale 2, correct filename, special characters in product name

---

## Technical Notes

- **Library:** `dom-to-image-more` (MIT license — confirmed compatible with commercial use; ~45 kB gzipped)
- **Lazy loading:** import inside the click handler, not at module top level
- **Capture target:** a wrapper `<div ref={chartRef}>` placed around the stat-cards grid + `CostBreakdownChart` section in `ProductPageClient`
- **Download pattern:** `toPng(node, { scale: 2 })` → assign data URL to `<a download="trueprice-{slug}.png">` → programmatic `.click()`
- **Slug sanitization:** strip non-alphanumeric chars, replace spaces with hyphens, lowercase — same approach used in category slugs elsewhere
- **Component placement:** `src/components/atoms/SaveAsImageButton.tsx` — receives `chartRef: RefObject<HTMLElement | null>` and `productName: string`
- **Stack compliance:** client component; no Service required (pure UI utility); no API route

---

## Open Questions

None — all design decisions resolved before implementation. Shipped in PR #19.
