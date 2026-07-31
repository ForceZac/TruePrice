# TruePrice Implementation Roadmap v2

Generated from PROJECT_KEYS.md section 12 — 2026-07-30

## Dependency Graph

```
Goal 1 (Scaffold)
├── Goal 2 (Commodity Prices)
│   └── Goal 4 (Cost Engine) ← also needs Goal 3
├── Goal 3 (Product Lookup)
│   └── Goal 4 (Cost Engine)
│       └── Goal 5 (Product Page UI)
│           ├── Goal 6 (Category Browsing)
│           │   └── Goal 7 (AdSense)
│           │       └── Goal 8 (Data Expansion)
│           └── Goal 9 (Comparison & Social)
```

## Goals

### Goal 1 — Project Scaffold & Data Model ⬅️ START HERE
- **TRD:** `trds/goal1-project-scaffold.md` — status: ready
- **Why:** Everything depends on a solid schema and project setup.
- **Done when:** Next.js scaffolded, Prisma schema defined, seed data works, Vercel deploys.

### Goal 2 — Commodity Price Integration
- **TRD:** `trds/goal2-commodity-prices.md` — status: ready (blocked by Goal 1)
- **Why:** Live commodity prices are the foundation of every cost estimate.
- **Done when:** CommodityService fetches/caches prices, 30+ materials mapped, daily cron refreshes.

### Goal 3 — Product Lookup (Search + Barcode)
- **TRD:** `trds/goal3-product-lookup.md` — status: ready (blocked by Goal 1)
- **Why:** Users need to find products via barcode scan or search.
- **Done when:** Camera scanning works on mobile, search works, products cached from Open Food Facts + UPCitemdb.

### Goal 4 — Cost Estimation Engine
- **TRD:** `trds/goal4-cost-estimation-engine.md` — status: ready
- **Why:** The core value — turning materials + commodity prices into cost breakdowns.
- **Depends on:** Goal 2 + Goal 3

### Goal 5 — Product Page & Cost Breakdown UI
- **TRD:** `trds/goal5-product-page-ui.md` — status: ready
- **Why:** Users need to see the breakdown in a clear, engaging, shareable format.
- **Depends on:** Goal 4

### Goal 6 — Category Browsing & Landing Pages
- **TRD:** `trds/goal6-category-browsing.md` — status: ready
- **Why:** SEO, discovery, and enough content for AdSense approval.
- **Depends on:** Goal 5

### Goal 7 — AdSense Integration & Required Pages
- **TRD:** `trds/goal7-adsense-integration.md` — status: ready
- **Why:** Monetization.
- **Depends on:** Goal 6

### Goal 8 — Data Expansion & Accuracy Improvements
- **TRD:** needs writing
- **Why:** More products, better estimates, broader coverage.
- **Depends on:** Goal 7

### Goal 9 — Product Comparison & Social Features
- **TRD:** needs writing
- **Why:** Engagement and virality.
- **Depends on:** Goal 5
