# PRD: Goal 27 — Accuracy Voting & Community Corrections

- **Goal reference:** Goal 27 (proposed — awaiting Zach approval before TRD is written)
- **Status:** PROPOSAL
- **Depends on:** Goal 10 (User Accounts), Goal 15 (User-Submitted Products), Goal 16 (Data Quality & Accuracy Refresh)
- **Proposed by:** PM Run #237 (2026-08-11)

---

## Problem Statement

TruePrice's cost estimates are algorithmically generated from commodity prices, labor rates, and category-level material compositions. Some estimates are highly accurate; others — particularly for products with unusual material mixes, non-standard countries of origin, or missing UPCitemdb data — are off by meaningful amounts. Right now there is no feedback loop. TruePrice shows estimates as facts, users who spot errors have no way to flag them, and the confidence signal ("HIGH / MEDIUM / LOW") is computed from data completeness alone, not from user experience.

Three concrete gaps:

1. **Silent inaccuracy.** A user who knows that a $12.99 t-shirt is made from 100% linen (not polyester) sees a wrong estimate and has no recourse except leaving the site. That knowledge is lost, the error persists, and the next visitor sees the same wrong number. The confidence badge ("MEDIUM") provides no signal that this particular estimate is contested.

2. **Trust is binary.** Users either trust TruePrice wholesale or they don't. There is no mechanism for the community to surface "this one looks off" vs. "this estimate seems right based on what I know." A lightweight voting layer converts passive skepticism into actionable accuracy signal.

3. **No expert contribution path.** Some users have domain expertise — supply chain professionals, commodity traders, textile buyers — who could meaningfully improve estimates with specific corrections. Goal 15 added user-submitted products; Goal 27 adds user-submitted corrections to existing products. The moderation infrastructure (admin review, approval notifications) already exists and can be reused.

---

## User Stories

**US-1 — Vote on estimate accuracy**
As a user on a product page, I want to vote whether the cost estimate seems "About right" or "Seems off," so I can contribute a quick accuracy signal without needing to know exact figures.

**US-2 — View community confidence**
As a user, I want to see how many people voted on an estimate and what proportion found it accurate, so I can calibrate my trust in the number alongside the algorithmic confidence badge.

**US-3 — Submit a correction**
As a user who knows that a product's estimate is wrong, I want to submit a correction with a reason (e.g., "This is 100% linen, not polyester — materials are wrong"), so the data can be improved rather than just flagged.

**US-4 — Admin correction review**
As Zach (admin), I want to see pending corrections in `/admin/corrections` with the user's reasoning and the affected product, so I can accept or reject each correction and update the underlying data where warranted.

**US-5 — Correction status notification**
As a user who submitted a correction, I want to receive an email when my correction is reviewed, so I know whether my contribution was accepted and why.

**US-6 — Vote without account (lightweight)**
As a visitor who doesn't have an account, I want to still be able to vote "Seems off" or "About right" via a cookie-scoped vote, so the signal is as wide as possible without forcing sign-up.

---

## Requirements

### Must-Have

- **`AccuracyVoteService`** (`src/services/AccuracyVoteService.ts`) — sole owner of vote recording and tallying. Methods:
  - `recordVote(productId, verdict: 'ACCURATE' | 'INACCURATE', userId?: string, sessionToken?: string)` — upserts one vote per user/session per product. Authenticated users use `userId`; unauthenticated use a `tp_vote_<uuid>` cookie (set `httpOnly`, `SameSite=Lax`, `MaxAge=365 days`). Both can vote; a later authenticated vote replaces an anonymous one from the same session.
  - `getVoteSummary(productId)` — returns `{ totalVotes, accurateCount, inaccurateCount, userVote?: 'ACCURATE' | 'INACCURATE' | null }`.
  - `canVote(productId, userId?, sessionToken?)` — returns whether this user/session has already voted (true until they vote, then false until they change their vote).

- **`AccuracyVote` Prisma model.** New model:
  - `id` (cuid), `productId` (FK → Product), `userId` (FK → User, nullable), `sessionToken` (string, nullable), `verdict` (`ACCURATE` | `INACCURATE`), `createdAt`, `updatedAt`.
  - Unique constraint: `(productId, userId)` for authenticated votes; `(productId, sessionToken)` for anonymous. One vote per product per identity.

- **Vote widget on product pages.** Below the cost breakdown chart, above the "Save as Image" button (Goal 11a placement). Displays:
  - Question: "Does this estimate seem accurate?"
  - Two buttons: "Looks right ✓" (ACCURATE) and "Seems off ✗" (INACCURATE). Rendered as atom `AccuracyVoteWidget`.
  - After voting: buttons replaced with the tally: "X% of Y voters found this accurate." The user's current vote is highlighted (can be changed).
  - If no votes yet: no tally shown — just the two buttons.
  - Client component; votes submitted via `POST /api/products/[id]/vote` (TanStack Query mutation).

- **`POST /api/products/[id]/vote`** — body: `{ verdict: 'ACCURATE' | 'INACCURATE' }`. Auth: optional (reads session if present; falls back to vote cookie). Calls `AccuracyVoteService.recordVote()`. Returns updated `{ accurateCount, inaccurateCount, totalVotes, userVote }`.

- **`GET /api/products/[id]/vote`** — returns the vote summary for the product page. Called on page load by the `AccuracyVoteWidget` TanStack Query hook.

- **Accuracy signal in cost breakdowns.** When `inaccurateCount / totalVotes > 0.5` and `totalVotes >= 10`, show a `CommunityFlagBadge` on the breakdown card: "Community flagged — estimate may be off." This is distinct from the algorithmic confidence badge. Both can be shown simultaneously.

- **`CorrectionService`** (`src/services/CorrectionService.ts`) — sole owner of correction lifecycle. Responsibilities: create, list-for-admin, approve, reject. Delegates approval email to `NotificationService`. Does not perform cost recalculation — that is triggered separately by `CostEstimationService`.

- **`ProductCorrection` Prisma model.** New model:
  - `id` (cuid), `productId` (FK → Product), `userId` (FK → User), `reason` (text — 500 char max), `proposedChange` (JSON — structured field describing what's wrong: `{ field: 'materials' | 'countryOfOrigin' | 'laborRate' | 'other', detail: string }`), `status` (`PENDING` | `APPROVED` | `REJECTED`), `adminNote` (text, nullable), `createdAt`, `reviewedAt` (nullable), `reviewedBy` (FK → User, nullable).

- **"Submit a Correction" link on product pages.** Shown only to authenticated users. Opens a modal (not a new page) with:
  - "What seems wrong?" dropdown: Materials composition / Country of origin / Labor rate assumption / Something else.
  - Text area for details (500 char limit).
  - Submit button → `POST /api/products/[id]/corrections`.
  - After submit: "Thanks — we'll review this and update the estimate if your correction checks out."

- **`POST /api/products/[id]/corrections`** — auth required. Body: `{ field, detail }`. Creates a `ProductCorrection` with `status: PENDING`. Calls `CorrectionService.createCorrection()`. Dispatches a Discord ping to `DISCORD_CHANNEL_ALERTS` via `NotificationService` (same pattern as Goal 15 submission pings): `🔧 Correction submitted for <product name> — review at /admin/corrections`.

- **Admin UI at `/admin/corrections`** — lists `PENDING` corrections grouped by product. For each: product name, submitting user's email, field flagged, detail text, "Approve" and "Reject" buttons. Approve → `PATCH /api/admin/corrections/[id]` sets status APPROVED + triggers `CostEstimationService` re-estimate on that product. Reject → sets REJECTED + optional admin note. Both send a status email to the submitter via `NotificationService`.

- `tsc --noEmit` clean; unit tests for `AccuracyVoteService` (record vote authenticated, record vote anonymous, change vote, tally computation, duplicate vote upsert) and `CorrectionService` (create, approve, reject).

### Should-Have

- **Vote-driven confidence weight.** When `totalVotes >= 25` and `accuratePercent >= 90%`, automatically upgrade the product's confidence to `HIGH` (if it was MEDIUM or LOW). When `inaccuratePercent >= 60%` and `totalVotes >= 10`, add an admin task to the correction queue for manual review. No automatic downgrade — keep human oversight for negative signals.
- **Correction history tab on product page** — a "Corrections & votes" tab (collapsed by default) showing accepted corrections with their approved change summaries. Builds transparency, similar to Wikipedia edit history.
- **Leaderboard for top contributors** — users who submit corrections that get approved earn a "Contributor" badge on their profile. Deferred if scope is too large.

### Won't Have (v1)

- Anonymous corrections — voting without auth is low-friction enough; corrections require auth to prevent spam and enable follow-up contact
- Public display of raw "seems off" count without context — show only to admin; public widget shows only `accuratePercent`
- Automatic cost recalculation from corrections — admin manually triggers re-estimate; never auto-recalculate from unreviewed user input
- Reputation scoring or karma system — beyond scope for v1; deferred to a community features goal

---

## Acceptance Criteria

- [ ] An authenticated user can vote "Looks right" on a product page; the vote tally updates and shows their current vote
- [ ] An unauthenticated user can vote via a cookie-scoped vote; the `tp_vote_<uuid>` cookie is set and the tally reflects their vote
- [ ] Voting twice on the same product from the same identity upserts (not duplicates) the vote
- [ ] When `inaccurateCount / totalVotes > 0.5` and `totalVotes >= 10`, the `CommunityFlagBadge` is visible on the product page breakdown card
- [ ] An authenticated user can submit a correction via the modal; a Discord ping appears in `#alerts`
- [ ] `/admin/corrections` lists pending corrections with product name, user, field, and detail
- [ ] Approving a correction sets its status to APPROVED, sends an email to the submitter, and triggers a re-estimate on that product
- [ ] Rejecting a correction sets its status to REJECTED and sends an email to the submitter
- [ ] `AccuracyVoteService` unit tests pass: record authenticated vote, anonymous vote, change vote, tally, duplicate upsert
- [ ] `CorrectionService` unit tests pass: create, approve, reject
- [ ] All existing tests continue to pass; `tsc --noEmit` clean

---

## Technical Notes

- **SoC:** `AccuracyVoteService` owns all vote logic. `CorrectionService` owns all correction lifecycle logic. Neither service calls the other. `CostEstimationService` is called by the admin route handler on correction approval — not by `CorrectionService` directly (SoC: services must not call each other).
- **Anonymous vote session:** The `tp_vote_<uuid>` cookie is set by `POST /api/products/[id]/vote` on the first anonymous vote (server-generated UUID). The cookie value is used as `sessionToken` in the `AccuracyVote` model. If the user later logs in, their authenticated vote replaces the anonymous one for the same product (upsert on `(productId, userId)`).
- **Vote tally on page load:** The `AccuracyVoteWidget` client component fetches the tally via TanStack Query (`GET /api/products/[id]/vote`). The server-rendered product page does not wait for the tally (it is deferred to the client component). This keeps the server render fast.
- **`CommunityFlagBadge` threshold:** `totalVotes >= 10` prevents the badge from appearing on noisy low-volume data. The 50% threshold means a simple majority considers it wrong — conservative enough to avoid false flags but sensitive enough to surface real issues.
- **Correction approval re-estimate:** When a correction is approved, the admin route handler calls `CostEstimationService.estimateCost(productId, { forceRefresh: true })`. The specific field changes (e.g., updated material composition) are made to the `Product` or `ProductMaterial` records before triggering re-estimation — this requires admin to manually update the underlying data via the admin panel or seed, not an automatic field application from the correction text. The correction captures the human judgment; implementation of the fix is a separate admin action.
- **Discord ping gating:** Same pattern as Goal 15 — gate on `DISCORD_CHANNEL_ALERTS` env var presence. No-op in local dev.
- **New env var:** None required. Reuses `DISCORD_CHANNEL_ALERTS`, `RESEND_API_KEY`, `FROM_EMAIL`, `ADMIN_EMAILS` from existing env.
- **Prisma migrations:** Two new models (`AccuracyVote`, `ProductCorrection`). Single migration file.

---

## Open Questions

**Q27-1: Vote display — show only accuratePercent, or show both counts?**
Showing "75% accurate (40 votes)" is more nuanced but may anchor users. Showing "Looks right ✓ 30 / Seems off ✗ 10" gives more context. Showing nothing until a threshold (e.g., 5 votes) avoids early noise.
- Suggested default: Show `XX% of N voters found this accurate` once `totalVotes >= 5`; hide the widget tally (not the buttons) below that threshold.
- **Owner:** Zach | **Priority:** Low — doesn't affect implementation; can be decided at design review

**Q27-2: Correction field granularity — structured dropdown or free text only?**
A structured `proposedChange` JSON (with `field` enum + `detail` text) helps admins triage faster and could eventually support automated field updates. Free text only is simpler to build. The dropdown options (Materials / Country / Labor / Other) are low-cost to add and high-value for routing corrections.
- Suggested default: Dropdown + text area (as specified in requirements). Four-option dropdown is minimal; free text captures the detail.
- **Owner:** PM | **Priority:** Decided (dropdown + text area)

**Q27-3: Should the CommunityFlagBadge suppress or override the algorithmic confidence badge?**
When a product has a HIGH confidence (algorithmically) but is community-flagged, showing both signals is potentially confusing. Options: (a) always show both independently, (b) community flag downgrades displayed confidence to MEDIUM, (c) hide algorithmic badge when community flag is active.
- Suggested default: Show both independently with distinct labels. "Our estimate: HIGH confidence" + "⚠️ Community flagged." Explains the tension rather than hiding it. Revisit if user testing reveals confusion.
- **Owner:** Zach | **Priority:** Low — editorial / design decision; can be changed post-launch
