# PRD: Goal 25 — Internationalization (i18n)

- **Goal reference:** Goal 25 (proposed — awaiting Zach approval before TRD is written)
- **Status:** PROPOSAL
- **Depends on:** Goal 5 (Product Page UI), Goal 10 (User Accounts), Goal 24 (Cost Explorer)
- **Proposed by:** PM Run #235 (2026-08-07)

---

## Problem Statement

TruePrice shows all manufacturing costs in USD regardless of where users are. For a product positioned around "what things actually cost to make," the currency matters — a €29 manufacturing cost lands differently than $32. International users see USD amounts with no local purchasing-power context, reducing both trust and shareability.

Three concrete gaps:

1. **All monetary display is USD-only.** Users in the EU, UK, Canada, Australia, and Japan see USD amounts that are meaningless relative to the retail prices they encounter daily. The breakdown feels foreign and academically abstract rather than personally relevant.

2. **"If made in the USA" card (Goal 24) is US-centric by design.** For a user in Germany, the compelling question isn't "what if it was made in America?" — it's "what if it was made here?" The card is a missed engagement opportunity for the majority of the world.

3. **Number formatting is locale-agnostic.** European users expect `1.234,56 €` not `$1,234.56`. The display layer uses `Intl.NumberFormat` internally but only ever passes `'en-US'` and `'USD'` — an easy fix that has an outsized impact on perceived quality for non-US users.

---

## User Stories

**US-1 — Currency display in local context**
As a user in Germany, I want to see manufacturing costs displayed in EUR alongside USD, so I can relate the cost to prices I see in my local stores rather than converting in my head.

**US-2 — Locale-correct number formatting**
As a user in Japan, I want prices formatted as ¥2,340 (not $15.67), so the numbers feel concrete and familiar rather than requiring mental translation.

**US-3 — "If made locally" card**
As a non-US user, I want the "what if" feature card (Goal 24) to show my country's manufacturing cost estimate instead of US-specific framing, so the labor-rate comparison is relevant to me.

**US-4 — Automatic locale detection**
As a first-time visitor, I want my locale to be inferred from my browser's `Accept-Language` header on the first visit, so I don't have to manually select it.

**US-5 — Manual override**
As a user, I want to manually override my currency from a selector in the site header, so I can view prices in any supported currency regardless of my location or browser settings.

---

## Requirements

### Must-Have

- **`LocaleService`** (`src/services/LocaleService.ts`) — sole owner of locale detection, currency conversion, and cost formatting. Methods:
  - `detectLocale(request: Request): string` — parses `Accept-Language` header; returns IETF language tag (e.g., `'de-DE'`); falls back to `'en-US'`
  - `getCurrencyForLocale(locale: string): string` — maps locale to ISO 4217 code (`'de-DE'` → `'EUR'`); falls back to `'USD'`
  - `getExchangeRates(): Promise<Record<string, number>>` — returns cached rates from the exchange-rate API; refreshed once daily via Vercel Cron, cached server-side with a 24-hr TTL
  - `formatCurrency(cents: number, locale: string, currency: string): string` — wraps `Intl.NumberFormat`; converts from USD cents to the target currency and formats with the correct locale

- **Locale detection + cookie.** On each request, the server middleware reads:
  1. The `locale` cookie (user override, if set)
  2. The `Accept-Language` header (first-visit fallback)
  The detected locale is available to server components via a request-scoped context. A `locale` cookie is set (`SameSite=Lax; Path=/; Max-Age=31536000`) when the user changes currency from the selector.

- **Currency display on cost breakdowns.** On product pages, show both the USD value (canonical) and the local-currency equivalent side-by-side: e.g., "Total manufacturing cost: **$32.40 USD** / **€29.70 EUR**". The local-currency value is labeled as approximate ("≈ €29.70"). Update `CostBreakdownChart` molecule and the summary cost cards to accept a `locale` + `currency` prop.

- **`LocaleSelector` atom component** (`src/components/atoms/LocaleSelector.tsx`) in the site header. Dropdown of supported currencies with country flag emoji + currency code (e.g., "🇩🇪 EUR"). Selecting a currency: (a) sets the `locale` cookie, (b) updates Zustand `currency` state, (c) triggers a re-render of all cost displays without a full page reload (TanStack Query cache invalidation is not needed — format only). Supported currencies for v1: USD, EUR, GBP, CAD, AUD, JPY.

- **Exchange rate cron.** `GET /api/cron/refresh-exchange-rates` — Vercel Cron (daily 06:00 UTC, before market open). Fetches rates from the configured exchange rate source, writes to a `ExchangeRate` Prisma model (`currency` string PK, `rateToUsd` float, `fetchedAt` timestamp). All `LocaleService.getExchangeRates()` calls read from this table; no per-request API calls to the exchange rate provider.

- **`ExchangeRate` Prisma model.** New model in `schema.prisma`. Migration required.

- **"If made locally" variant (Goal 24 integration).** When the user's detected country is present in the `LaborRate` table and is not the USA, the Goal 24 "If made in the USA" feature card changes to "If manufactured locally" and runs `CostExplorerService.computeScenario(id, { countryOfOrigin: detectedCountry })`. Falls back to the USA card if the user's country is not in `LaborRate`.

- **Existing `Intl.NumberFormat` call sites updated.** Every place that formats a monetary value must go through `LocaleService.formatCurrency` rather than hardcoding `'en-US'`/`'USD'`. No raw `Intl.NumberFormat` calls with hardcoded locale in app code.

- `tsc --noEmit` clean; unit tests for `LocaleService`: locale detection from header, currency mapping, formatting (USD, EUR, JPY), exchange rate cache hit/miss.

### Should-Have

- **UI language translation (EN + ES).** Use Next.js App Router's built-in i18n routing (`/en/`, `/es/`). Translates static copy: navigation labels, chart axis labels, card headings, error messages. Does not translate user-generated product names or brand names.
- **Language selector** alongside the currency selector in the header.
- **FR and DE as additional languages.** Brings coverage to ~85% of international web traffic.

### Won't Have (v1)

- Right-to-left (RTL) layout support — deferred; requires significant layout restructuring
- Currency as a filter criterion on leaderboard/trending pages — deferred; adds query complexity
- Real-time exchange rate updates within a user session — daily refresh is sufficient
- CNY, INR, BRL, MXN support — deferred to v2 (adds 6 currencies, ~10% additional coverage)

---

## Acceptance Criteria

- [ ] A user with `Accept-Language: de-DE` sees costs in EUR by default on first visit (no cookie set)
- [ ] Selecting EUR from the `LocaleSelector` sets the `locale` cookie and all cost displays update to EUR without a page reload
- [ ] `LocaleService.formatCurrency(3240, 'de-DE', 'EUR')` returns a correctly formatted EUR string (e.g., `"29,70 €"`)
- [ ] Exchange rates are fetched and stored by the cron; `LocaleService.getExchangeRates()` reads from DB (no per-request external API call)
- [ ] The "If made locally" card appears for users with a detected country that is in the `LaborRate` table and is not the USA; shows local labor rate in local currency
- [ ] The "If made in the USA" card appears for users with a US locale or a country not in `LaborRate`
- [ ] No hardcoded `'en-US'`/`'USD'` in any `Intl.NumberFormat` call in app code
- [ ] All existing tests pass; new `LocaleService` unit tests pass
- [ ] `tsc --noEmit` clean

---

## Technical Notes

- **All monetary storage remains USD cents.** Currency conversion is display-only — never persisted. The `CostBreakdown`, `CommodityPrice`, and `LaborRate` tables are not touched by this goal.
- **`Intl.NumberFormat` is already in use.** The change is purely in the arguments passed — swap `'en-US'` and `'USD'` for the locale-detected values. Most of the work is in threading the locale through the component tree.
- **Exchange rate source.** Frankfurter (`api.frankfurter.app`) is a free, open-source API with no API key required. It provides ECB rates for EUR, GBP, JPY, CAD, AUD, and others. Suitable for daily cron fetch. If uptime becomes a concern, migrate to the ECB's own XML feed (`https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml`). No new env var needed for Frankfurter.
- **Client-side currency rendering.** The `LocaleSelector` component reads Zustand `currency` state (new key in global store). Cost display components subscribe to this state. Server components that render cost values (e.g., the "If made locally" card) receive locale as a prop resolved from the cookie in the server component.
- **SoC.** `LocaleService` handles locale detection and formatting only. It does not fetch product data or perform cost estimation. No other module may call the exchange rate API or format currency values — delegate to `LocaleService`.
- **New env var:** none required for Frankfurter. If switching to a paid provider later, add `EXCHANGE_RATE_API_KEY` to `env.server.ts`.

---

## Open Questions

**Q25-1: Exchange rate source — Frankfurter vs. ECB XML vs. paid provider**
Frankfurter is zero-setup (no API key, hosted by a third party, ECB-sourced data). The risk is third-party uptime. ECB's own XML feed requires parsing but eliminates the third-party dependency. A paid provider (Open Exchange Rates, $12/mo) adds reliability but costs money.
- Suggested default: Frankfurter for v1 (no new env var, quickest to ship). If uptime is a concern after launch, switch to ECB XML — the interface change to `LocaleService.getExchangeRates()` is internal.
- **Owner:** PM | **Priority:** Must decide before TRD is written

**Q25-2: Currency-only vs. full i18n (language + currency) for v1**
Full i18n (language routing with i18next or Next.js route groups) is 3–4× the scope of currency-display-only. Currency display alone covers the primary complaint (USD amounts feel foreign). Language translation adds significant ongoing maintenance (keeping strings in sync).
- Suggested default: currency display only for v1. The Should-Have language translation is a stretch goal — include in TRD only if Zach approves the larger scope.
- **Owner:** Zach | **Priority:** High — this is a scoping decision that changes implementation size significantly. Needs a call before TRD is drafted.

**Q25-3: Supported currencies for v1**
USD/EUR/GBP/CAD/AUD/JPY covers ~80% of international web traffic. Adding CNY, INR, BRL, MXN adds ~10% more but increases the supported country list and the "If made locally" card logic.
- Suggested default: 6 currencies (USD, EUR, GBP, CAD, AUD, JPY) for v1. Expand in a patch if there's user demand.
- **Owner:** PM | **Priority:** Low — default is reasonable, Zach can override
