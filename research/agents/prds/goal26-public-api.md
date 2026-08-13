# PRD: Goal 26 — Public API & Developer Platform

- **Goal reference:** Goal 26 (proposed — awaiting Zach approval before TRD is written)
- **Status:** PROPOSAL
- **Depends on:** Goal 10 (User Accounts), Goal 17 (Product Slug URLs), Goal 16 (Data Quality & Accuracy Refresh)
- **Proposed by:** PM Run #237 (2026-08-11)

---

## Problem Statement

TruePrice's cost breakdowns are uniquely valuable data. Journalists, researchers, developers building shopping extensions, and consumer advocates want programmatic access to that data — but there is no sanctioned way to get it. The internal API (`/api/products/[id]/cost`) is not designed for external consumption: no API keys, no versioning, no rate limiting, no documentation, and no usage visibility.

Three concrete gaps:

1. **No authenticated developer access.** Anyone who reverse-engineers the internal API routes can hit them without limits, attribution, or control. There is no mechanism to issue keys, revoke bad actors, or understand who is using the data. A public API without authentication is either unusable (rate-limited by IP into uselessness) or exploitable.

2. **No stable contract.** Internal routes can change shape at any time as the app evolves. A developer who builds a tool today has no guarantee the response schema is the same tomorrow. Without versioning, TruePrice cannot evolve its internal implementation without breaking external consumers.

3. **Lost growth channel.** Third-party integrations — browser extensions, price trackers, media embeds, educational tools — are among the highest-ROI distribution channels for data products. Each tool built on TruePrice's API extends reach without additional marketing spend. Right now that channel is closed.

---

## User Stories

**US-1 — Developer registration**
As a developer, I want to register for API access and receive a key, so I can start building a TruePrice-powered feature in my app without scraping the site.

**US-2 — Product cost lookup**
As a developer, I want to call `GET /api/v1/products/{id}/cost` with my API key and receive a stable JSON cost breakdown, so I can display manufacturing cost data in my own application.

**US-3 — Product search**
As a developer, I want to call `GET /api/v1/products/search?q={query}` to find products by name or UPC, so I can support product lookup in my integration.

**US-4 — Rate limit transparency**
As a developer, I want my API responses to include `X-RateLimit-Remaining` and `X-RateLimit-Reset` headers, so my integration can back off gracefully before hitting the limit.

**US-5 — Usage dashboard**
As a developer, I want to see how many API calls I've made this month and my remaining quota, so I can manage my usage and know when to upgrade.

**US-6 — Key revocation**
As Zach (admin), I want to revoke any API key from the admin dashboard, so I can immediately cut off abusive consumers without a deploy.

---

## Requirements

### Must-Have

- **`ApiKeyService`** (`src/services/ApiKeyService.ts`) — sole owner of API key lifecycle. Responsibilities: generate keys (crypto-secure random, `tp_live_<32-char-hex>` prefix), hash for storage (SHA-256; never store plaintext), validate incoming key against hash, record per-key usage counts (daily + monthly rolling), enforce rate limits, revoke keys.

- **`ApiKey` Prisma model.** New model in `schema.prisma`:
  - `id` (cuid), `userId` (FK → User), `keyHash` (string, unique), `prefix` (first 8 chars of key, for display — e.g. `tp_live_a`), `name` (string — developer-assigned label), `createdAt`, `lastUsedAt`, `revokedAt` (nullable), `monthlyCallCount` (int), `dailyCallCount` (int), `dailyCallResetAt` (timestamp).
  - Free tier limit: 1,000 calls/day, 10,000 calls/month.
  - One key per user (v1). Multiple keys deferred to v2.

- **API versioned routes under `/api/v1/`.** New routes, independent of the existing internal routes:
  - `GET /api/v1/products/search` — accepts `?q=` (text or UPC), returns array of `{ id, slug, name, brand, category, retailPriceCents }`. Max 20 results. Uses `ProductService.search()` internally.
  - `GET /api/v1/products/{id}` — returns full product record: id, slug, name, brand, category, weight, countryOfOrigin, retailPriceCents.
  - `GET /api/v1/products/{id}/cost` — returns cost breakdown: materialCostCents, laborCostCents, overheadCostCents, shippingCostCents, totalCostCents, retailPriceCents, markupPercent, confidence. Triggers `CostEstimationService` if no fresh breakdown exists.
  - `GET /api/v1/commodities/prices` — returns all current commodity prices (materialId, pricePerKgCents, fetchedAt). Public data, still requires API key.

- **API key authentication middleware.** Applied to all `/api/v1/*` routes. Reads `Authorization: Bearer <key>` header. Calls `ApiKeyService.validateKey(key)` — returns the key record or throws 401. On valid key: increments usage counters, sets `X-RateLimit-Remaining` and `X-RateLimit-Reset` headers, passes request to the handler. On rate-limit exceeded: returns 429 with `{ error: "Rate limit exceeded", reset: <ISO timestamp> }`.

- **Developer dashboard at `/account/api-keys`** (auth-gated). UI:
  - Show existing key (prefix + `•••••••••••••••`) + creation date + last used date + monthly usage / limit.
  - "Generate API Key" button — calls `POST /api/account/api-keys`, shows the full key **once** (copy-to-clipboard, then never shown again).
  - "Revoke Key" button — calls `DELETE /api/account/api-keys/{id}`, asks for confirmation.
  - Monthly usage bar (calls used / limit).

- **Admin key management at `/admin/api-keys`** — lists all keys (user email, prefix, monthly calls, last used, revoked status), revoke button per key.

- **Stable JSON response schema.** All `/api/v1/*` responses follow a consistent envelope: `{ data: <result>, meta: { requestId, generatedAt } }`. Errors: `{ error: { code, message } }`. Schema version pinned at `v1`; breaking changes require a new `/api/v2/` prefix.

- **API documentation page at `/docs/api`** — static Next.js page (not MDX dependency). Covers: authentication, rate limits, endpoints with request/response examples, error codes. No interactive sandbox for v1.

- `tsc --noEmit` clean; unit tests for `ApiKeyService`: key generation, hash/validate round-trip, rate limit enforcement (over limit returns false), revocation (revoked key returns 401).

### Should-Have

- **Webhook support** — allow developers to register a URL to receive a POST when a product's cost breakdown updates (re-estimation cron fires). Deferred if scope is too large; useful for price-tracker integrations.
- **CSV export endpoint** — `GET /api/v1/products/export.csv?category=electronics` — paginated CSV of products + breakdowns for batch research use cases.
- **SDK code samples** — JavaScript/TypeScript and Python snippets on the `/docs/api` page (copy-paste, no installable package for v1).

### Won't Have (v1)

- Multiple API keys per user — single key is sufficient; multiple keys add UX complexity without v1 demand signal
- Paid tiers / billing integration — free tier only for launch; revisit when API traffic warrants it
- GraphQL API — REST is simpler to document and consume; GraphQL deferred until there's a use case that requires flexible querying
- OAuth2 / service account auth — Bearer key is sufficient for developer integrations; OAuth2 deferred for when enterprise partners need delegated access
- Interactive API explorer (Swagger UI) — out of scope for v1; static docs are sufficient for launch

---

## Acceptance Criteria

- [ ] A user can generate one API key from `/account/api-keys`; the full key is shown once on creation and never again
- [ ] `Authorization: Bearer <valid-key>` on `GET /api/v1/products/search?q=iphone` returns a 200 with a list of products
- [ ] `Authorization: Bearer <invalid-key>` returns a 401 `{ error: { code: "UNAUTHORIZED", message: "Invalid API key" } }`
- [ ] After 1,000 requests in a day, the key returns 429 with `X-RateLimit-Reset` set to the next midnight UTC
- [ ] `GET /api/v1/products/{id}/cost` returns `{ data: { materialCostCents, laborCostCents, overheadCostCents, shippingCostCents, totalCostCents, retailPriceCents, markupPercent, confidence }, meta: { requestId, generatedAt } }`
- [ ] Revoking a key from the admin panel causes subsequent requests with that key to return 401
- [ ] The developer dashboard shows correct monthly call count (read from `ApiKey.monthlyCallCount`)
- [ ] `/docs/api` renders with authentication instructions, endpoint reference, and example responses
- [ ] `ApiKeyService` unit tests pass: generate, validate, rate-limit exceeded, revoke
- [ ] All existing tests continue to pass; `tsc --noEmit` clean

---

## Technical Notes

- **Key format:** `tp_live_<32 lowercase hex chars>`. The `tp_live_` prefix (8 chars) is stored as `ApiKey.prefix` for display. The full key is hashed with SHA-256 (`crypto.createHash('sha256').update(key).digest('hex')`) before storage. Show the full key to the user **exactly once** at generation time.
- **SoC:** `ApiKeyService` handles key lifecycle only. It does not call `ProductService`, `CostEstimationService`, or any other service. The `/api/v1/*` route handlers call `ApiKeyService.validateKey()` first, then call the appropriate service (same services used by internal routes). No business logic in the route handlers themselves.
- **Rate limit storage:** Use `ApiKey.dailyCallCount` and `ApiKey.monthlyCallCount` in the DB. On each request, `ApiKeyService` runs a Prisma `update` with `increment: { dailyCallCount: 1, monthlyCallCount: 1 }` and checks the limits. This is simpler than Redis for v1 given low expected API volume. Revisit with Redis if rate-limit DB writes become a bottleneck.
- **Daily reset:** A Vercel Cron (`GET /api/cron/reset-api-quotas`, daily 00:00 UTC) runs `prisma.apiKey.updateMany({ data: { dailyCallCount: 0, dailyCallResetAt: new Date() } })`.
- **No conflict with internal routes:** All `/api/v1/*` routes are new files under `src/app/api/v1/`. Existing `/api/products/*` routes are unchanged. Internal routes are not auth-gated; public API routes always require a key.
- **`requestId`:** Use `crypto.randomUUID()` per request, set as `X-Request-Id` response header and included in the response meta. Useful for debugging and support.
- **New env var:** None required for v1. If paid tiers are added later, `STRIPE_SECRET_KEY` would be added.
- **Privacy Policy update:** The API key and usage data (email → key → call counts) must be disclosed in the Privacy Policy (see Q7-3 which is already open).

---

## Open Questions

**Q26-1: Free tier limits — 1,000/day vs. lower?**
1,000 calls/day is enough for a developer building a browser extension or research tool, but low enough to prevent scraping the full catalog in one day (100+ products × hourly refresh = well under 1,000). Alternative: 500/day is more conservative.
- Suggested default: 1,000/day, 10,000/month. Easy to adjust via a `ApiKey.dailyLimit` column before any key is issued.
- **Owner:** Zach | **Priority:** Must decide before TRD

**Q26-2: Developer approval — open registration vs. waitlist?**
Open registration (anyone with a TruePrice account can generate a key) is simpler and maximizes adoption. Waitlist (admin approval required) prevents abuse but adds friction and a manual step.
- Suggested default: Open registration for v1. The rate limits and key revocation provide enough abuse control. If abuse becomes a pattern, add email-domain allowlisting or require a verified account.
- **Owner:** Zach | **Priority:** Should decide before launch

**Q26-3: Webhook delivery reliability**
If Should-Have webhooks are included, delivery failures need retry logic (at least 3 attempts with exponential backoff). This adds meaningful complexity and a new `Webhook` + `WebhookDelivery` Prisma model. Recommendation: cut webhooks from v1 entirely, ship in a v1.1 patch once the core API has proven stable.
- Suggested default: Cut webhooks from v1. Static polling via `/api/v1/products/{id}/cost` is sufficient for all known use cases.
- **Owner:** PM | **Priority:** Low — doesn't block v1 launch
