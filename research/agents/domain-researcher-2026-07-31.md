# Domain Researcher Findings — 2026-07-31

## FINDING 1 — China Labor Rate Is Stale (Accuracy Risk)

**Current default in CostEstimationService:** $3.50/hr for unknown country of origin
**2026 market data:**
- China: ~$6.50/hr (was ~$3.50/hr circa 2018–2020)
- Vietnam: ~$3.00/hr
- Bangladesh: ~$0.84/hr
- India: ~$1.15/hr

The default understates China labor cost by ~2x. Since "China" is the fallback for unknown country of origin, most products with missing origin data will have labor costs half what they should be — pulling total estimates low and inflating the apparent markup shown to users.

**PROPOSAL-001:** Update the LaborRate seed data with 2026 country rates. Priority: China is the most impactful since it's the fallback default. A follow-up could add Vietnam, Bangladesh, and India if not already seeded.

Sources: <https://vinasources.com/blog/vietnam-vs-china-manufacturing-costs/> | <https://www.talentnetgroup.com/vn/featured-insights/compensation-benefits/vietnam-factory-worker-salary>

---

## FINDING 2 — API Ninjas Free Tier Prohibits Commercial Use (ToS Risk)

**Current setup:** API Ninjas free tier (10,000 req/month per code comments) covering cotton, steel, aluminum, copper, zinc, tin, nickel, sugar, wheat, cocoa, corn, soybean oil, palm oil, coffee, rubber.

**Problem:** API Ninjas explicitly prohibits commercial use on the free tier. TruePrice serves Google AdSense ads — that's commercial use. Launching publicly on the free tier is a ToS violation and risks API key revocation.

**Alternative identified: CommodityPriceAPI.com**
- 130+ commodities including all currently mapped materials
- Historical data back to 1990-01-01
- Lite tier: 2,000 calls/month (check commercial terms before using)
- Paid tiers available with explicit commercial licensing
- REST + JSON, similar API shape to API Ninjas — migration confined to `CommodityService.ts` and `commodity-mappings.ts`

**PROPOSAL-002:** Evaluate CommodityPriceAPI.com as a drop-in replacement for API Ninjas before public launch. If Zach approves, a developer can implement as a small contained PR (no schema changes needed).

Sources: <https://commoditypriceapi.com> | <https://api-ninjas.com/api/commodityprice>

---

## FINDING 3 — No Direct Competitors in Consumer Manufacturing-Cost Transparency

Searched broadly across Product Hunt, Reddit, and general web for consumer apps that reveal manufacturing cost vs. retail markup.

**Adjacent but not competitive:**
- **Buy'r** (Jan 2026): 50K downloads week 1, #1 App Store Health & Fitness on launch day. Shows who *owns* the brand (e.g. P&G owns Gillette). Brand ownership transparency, not cost transparency. Different use case.
- **Pricefy / Competera / Wiser / Minderest**: B2B competitive pricing tools for retailers. Not consumer-facing.
- **Tariffed**: Shopify plugin showing tariff costs to shoppers. Merchant-side, not cost-to-manufacture.

**Implication:** TruePrice has the consumer-facing manufacturing-cost lane to itself. Buy'r's launch validated strong consumer demand for corporate transparency tools — TruePrice is the cost-specific version of that.

---

## FINDING 4 — Industry Markup Benchmarks Validate TruePrice Data

2026 benchmark data:
- **Food & Beverage:** 8–15% operating margin; COGS 55–65% of revenue
- **Electronics (retail):** 3–7% margin — thin, high competition
- **Clothing/Apparel (e-commerce):** 50–65% gross margin
- **Cosmetics / Health Supplements:** 200–600% markups — customers paying for brand, packaging, perceived efficacy

These are consistent with TruePrice's overhead percentages and confidence tiers. The cosmetics number (200–600%) is a strong marketing hook — the product page should emphasize this for beauty/personal care items.

Source: <https://markupcalculation.com/markup-by-industry> | <https://eightx.co/blog/average-cogs-by-vertical>

---

## FINDING 5 — FTC Legal Posture Is Clean

- FTC textile rules require *manufacturers* to disclose fiber content + country of origin on product labels
- No rule prohibits third parties from publishing estimated manufacturing cost analysis
- Closest legal risk is trade libel, but TruePrice estimates are clearly labeled as estimates with HIGH/MEDIUM/LOW confidence tiers — this is adequate disclosure
- No action needed for launch

Source: <https://www.ftc.gov/business-guidance/industry/clothing-and-textiles>

---

## Open Proposals

| ID | Proposal | Status |
|----|----------|--------|
| PROPOSAL-001 | Update LaborRate table with 2026 country data (China $6.50/hr, Vietnam $3.00/hr, Bangladesh $0.84/hr, India $1.15/hr) | Awaiting Zach `/approve` |
| PROPOSAL-002 | Evaluate CommodityPriceAPI.com to replace API Ninjas (commercial licensing fix before public launch) | Awaiting Zach `/approve` |
