# Open Questions Parking Lot

Last updated: 2026-07-30 (PM Run #3)

This file replaces the missing PROJECT_KEYS.md section 13. All unresolved product decisions go here. Answered questions are moved to the **Resolved** section below.

---

## Open

### Goal 4 — Cost Estimation Engine

**Q4-1: Cron-triggered re-estimation**
Should the daily price cron automatically re-compute CostBreakdowns for all products, or lazily re-compute on next page view?
- Lazy is simpler for v1 but the first visitor after a price refresh hits a slow page
- Auto-compute is reliable but could be expensive at scale
- **Owner:** Zach | **Blocking:** TRD for Goal 4

**Q4-2: Labor rate default for unknown country of origin**
Default to US rate (conservative, highest) or global average (~$2–3/hr)?
- US rate would give misleading high labor cost for most manufactured goods
- Suggested default: China rate ($3.50/hr) as it covers the largest share of manufactured goods
- **Owner:** Zach | **Blocking:** TRD for Goal 4

### Goal 5 — Product Page & Cost Breakdown UI

**Q5-1: Chart type — stacked bar vs. donut**
Which chart type for the cost breakdown?
- Stacked bar: easier to read absolute values; familiar
- Donut: more visually striking on mobile; better for "wow" factor
- **Owner:** Zach | **Blocking:** TRD for Goal 5

### Goal 6 — Category Browsing & Landing Pages

**Q6-1: Category descriptions**
Who writes the 2–3 sentence unique blurb per category for SEO? Can be AI-drafted, but needs review. How many categories are seeded at this point?
- **Owner:** Zach | **Blocking:** TRD for Goal 6

**Q6-2: Pagination vs. load more**
Paginated routes (`/category/[slug]?page=2`) are better for SEO (each page indexable). "Load more" is better UX. Given AdSense approval is the near-term goal, SEO pagination is likely preferable.
- **Suggested answer:** Pagination with URL-based pages — prioritize indexability over UX convenience at this stage
- **Owner:** Zach (confirm)

**Q6-3: Minimum product count for AdSense**
How many products with estimates will TruePrice have seeded by Goal 6? If fewer than ~20 with real estimates, category pages may be too thin for AdSense approval.
- **Action needed:** Count seeded products with estimates; decide if more seed data is needed before AdSense submission
- **Owner:** Zach | **Blocking:** Goal 7

### Goal 7 — AdSense Integration

**Q7-1: AdSense account & publisher ID**
Has Zach created a Google AdSense account? Publisher ID (`ca-pub-XXXXXXXX`) needed before ads can serve. Review lag is typically 1–4 weeks after site submission.
- **Owner:** Zach | **Blocking:** Goal 7 launch

**Q7-2: Manual ad unit IDs**
Manual ad units require unit IDs created in the AdSense dashboard. Should manual units be wired at launch (needs IDs now) or launch with auto-ads only?
- **Suggested answer:** Launch with auto-ads only; add manual units after AdSense approves. Reduces pre-launch dependencies.
- **Owner:** Zach (confirm)

**Q7-3: Privacy Policy data scope**
Does TruePrice store any user data beyond standard server logs? This determines what the Privacy Policy must disclose. For v1 with no user accounts, the answer is likely "server logs only + AdSense cookies."
- **Owner:** Zach | **Blocking:** Privacy Policy content

### Infrastructure / Cross-cutting

**Q-INFRA-1: PROJECT_KEYS.md missing**
Multiple agent runs (TRD Watcher #1–#8, PM #2–#3) have flagged that `PROJECT_KEYS.md` does not exist, despite the roadmap claiming it was generated from it.
- TRD Watcher instructions reference sections 3 (tech stack) and 10 (separation of concerns)
- PM instructions reference sections 1, 2, 6, 7, 12, 13
- This blocks full TRD validation
- **Action needed:** Create PROJECT_KEYS.md or update agent prompt files to reference the correct docs
- **Owner:** Zach | **Priority:** High (blocking TRD validation rigor)

**Q-INFRA-2: Discord channels not allowlisted**
All agent runs have failed to post to Discord (#main, #standup, #prs, #alerts, #research).
- Requires user to run `/discord:access` in terminal
- All Discord posts since 2026-07-30 project init have silently failed
- **Action needed:** Zach runs `/discord:access` to configure allowlist
- **Owner:** Zach | **Priority:** High (agents can't close the loop)

---

## Resolved

### Goal 4

**Q4-3: Manufacturing hour estimates** — Category-level defaults are acceptable for v1 launch. Subcategory granularity deferred to Goal 8 (Data Expansion). A confidence hit at category level is acceptable and disclosed to users.
- **Resolved:** PM Run #2 (2026-07-30) — suggested answer accepted as working default

**Q4-4: Async vs sync estimation** — Go sync first; optimize queries to stay under 500ms (batch fetches, indexed joins). Only introduce async (202 + polling) if profiling shows >500ms at p95. Don't add async complexity prematurely.
- **Resolved:** PM Run #2 (2026-07-30) — suggested answer accepted as working default

### Goal 5

**Q5-2: "Calculate Cost" trigger** — Auto-trigger on page load for real users. Add `?bot=1` bypass or check user-agent to skip auto-trigger for known bot patterns. Avoids unnecessary compute from crawlers while keeping UX smooth.
- **Resolved:** PM Run #2 (2026-07-30) — suggested answer accepted as working default

**Q5-3: Markup framing** — Show both: primary display as multiplier ("5× markup"), secondary as "retail price is 400% above manufacturing cost." Multiplier is more visceral for sharing; percentage is technically precise.
- **Resolved:** PM Run #2 (2026-07-30) — suggested answer accepted as working default

**Q5-4: Low-confidence display** — Show category averages with disclaimer ("estimated for [category] products"). Never show empty state when we can give something useful. Prominent warning badge accompanies category-average estimates.
- **Resolved:** PM Run #2 (2026-07-30) — suggested answer accepted as working default

**Q5-5: OG image generation** — Plain meta tags for launch (Goal 5). Add dynamic OG image (`opengraph-image.tsx`) in Goal 9 (Social) when sharing becomes a focus. Reduces Goal 5 complexity.
- **Resolved:** PM Run #2 (2026-07-30) — suggested answer accepted as working default
