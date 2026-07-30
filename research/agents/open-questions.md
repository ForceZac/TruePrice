# Open Questions Parking Lot

Last updated: 2026-07-30 (PM Run #2)

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

**Q4-3: Manufacturing hour estimates**
Are category-level defaults acceptable for launch, or do we need subcategory granularity?
- e.g., "Clothing" is 1.5 hrs — but a basic t-shirt vs. a tailored suit differ wildly
- Subcategory table adds complexity; category-level is defensible for v1 with a confidence hit
- **Suggested answer:** Category-level for v1; add subcategory table in Goal 8 (Data Expansion)

**Q4-4: Async vs sync estimation**
If a product has many materials, estimation could take 1–2 seconds. Should the API be:
- (a) Sync — optimize queries to stay under 500ms (batch fetches, indexed joins)
- (b) Async — 202 + polling until done
- **Suggested answer:** Go sync first; optimize with batch queries. Only go async if profiling shows >500ms at p95. Don't add async complexity prematurely.

---

### Goal 5 — Product Page & Cost Breakdown UI

**Q5-1: Chart type — stacked bar vs. donut**
Which chart type for the cost breakdown?
- Stacked bar: easier to read absolute values; familiar
- Donut: more visually striking on mobile; better for "wow" factor
- **Owner:** Zach | **Blocking:** TRD for Goal 5

**Q5-2: "Calculate Cost" trigger — auto vs. button**
When no estimate exists, auto-trigger on page load or wait for user button press?
- Auto: smoother UX, estimate ready faster
- Button: avoids compute on bot/crawler visits; clearer mental model ("I'm requesting this")
- **Suggested answer:** Auto-trigger on page load for real users; add `?bot=1` bypass or check user-agent to skip bots

**Q5-3: Markup framing**
Show markup as percentage ("400% markup") or multiplier ("retail is 5× the cost")?
- Percentage: technically accurate, familiar
- Multiplier: more visceral for high-markup products; better for sharing
- **Suggested answer:** Show both — primary display as multiplier ("5× markup"), secondary as "retail price is 400% above manufacturing cost"

**Q5-4: Low-confidence display**
When confidence < 0.3, what to show?
- (a) Show estimate with prominent warning banner
- (b) Hide chart, show "insufficient data" with explanation
- (c) Show category averages with disclaimer ("estimated for [category] products")
- **Suggested answer:** Option (c) — category averages with disclaimer. Never show empty state when we can give *something* useful.

**Q5-5: OG image generation**
Custom OG image via `opengraph-image.tsx` or plain text meta tags for launch?
- Custom OG image makes shares more compelling (branded card with the key stats)
- Adds complexity; requires image generation route
- **Suggested answer:** Plain meta tags for launch (Goal 5); add dynamic OG image in Goal 9 (Social) when sharing becomes a focus

---

### Infrastructure / Cross-cutting

**Q-INFRA-1: PROJECT_KEYS.md missing**
Multiple agent runs (TRD Watcher #1–#8, PM #2) have flagged that `PROJECT_KEYS.md` does not exist, despite the roadmap claiming it was generated from it.
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

_(none yet)_
