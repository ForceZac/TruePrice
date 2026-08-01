# TruePrice Implementation Roadmap v2

Generated from PROJECT_KEYS.md section 12 — 2026-07-30; updated 2026-08-01

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
│           │           └── Goal 10 (User Accounts)
│           │               ├── Goal 11b (Price Alerts) ← also needs Goal 11a
│           │               └── Goal 13 (Weekly Digest) ← also needs Goal 12
│           ├── Goal 9 (Comparison & Social)
│           ├── Goal 11a (Save as Image)
│           └── Goal 12 (Enhanced Search) ← also needs Goal 8, Goal 9
```

## Goals

### Goal 1 — Project Scaffold & Data Model ✅ MERGED
- **TRD:** `trds/goal1-project-scaffold.md` — status: done
- **PR:** #1 merged 2026-07-30
- **Why:** Everything depends on a solid schema and project setup.

### Goal 2 — Commodity Price Integration ✅ MERGED
- **TRD:** `trds/goal2-commodity-prices.md` — status: done
- **PR:** #2 merged 2026-07-30
- **Why:** Live commodity prices are the foundation of every cost estimate.

### Goal 3 — Product Lookup (Search + Barcode) ✅ MERGED
- **TRD:** `trds/goal3-product-lookup.md` — status: done
- **PR:** #3 merged 2026-07-30
- **Why:** Users need to find products via barcode scan or search.

### Goal 4 — Cost Estimation Engine ✅ MERGED
- **TRD:** `trds/goal4-cost-estimation-engine.md` — status: done
- **PR:** #4 merged 2026-07-30
- **Why:** The core value — turning materials + commodity prices into cost breakdowns.
- **Depends on:** Goal 2 + Goal 3

### Goal 5 — Product Page & Cost Breakdown UI ✅ MERGED
- **TRD:** `trds/goal5-product-page-ui.md` — status: done
- **PR:** #5 merged 2026-07-30
- **Why:** Users need to see the breakdown in a clear, engaging, shareable format.
- **Depends on:** Goal 4

### Goal 6 — Category Browsing & Landing Pages ✅ MERGED
- **TRD:** `trds/goal6-category-browsing.md` — status: done
- **PR:** #10 merged 2026-07-30
- **Why:** SEO, discovery, and enough content for AdSense approval.
- **Depends on:** Goal 5

### Goal 7 — AdSense Integration & Required Pages ✅ MERGED
- **TRD:** `trds/goal7-adsense-integration.md` — status: done
- **PR:** #12 merged 2026-07-30
- **Why:** Monetization.
- **Depends on:** Goal 6

### Goal 8 — Data Expansion & Accuracy Improvements ✅ MERGED
- **TRD:** `trds/goal8-data-expansion.md` — status: done
- **PR:** #13 merged 2026-07-30
- **Why:** More products, better estimates, broader coverage.
- **Depends on:** Goal 7

### Goal 9 — Product Comparison & Social Features ✅ MERGED
- **TRD:** `trds/goal9-comparison-social.md` — status: done
- **PR:** #14 merged 2026-07-31
- **Why:** Engagement and virality.
- **Depends on:** Goal 5

### Goal 10 — User Accounts & Watchlist ✅ MERGED
- **TRD:** `trds/goal10-user-accounts.md` — status: done
- **PR:** #17 merged 2026-08-01
- **Why:** Personalization layer required by Goals 11a and 11b.
- **Depends on:** Goal 8

### Goal 11a — Save as Image Button ✅ MERGED
- **TRD:** `trds/goal11a-save-as-image.md` — status: done
- **PR:** #19 merged 2026-08-01
- **Why:** Shareable cost breakdown screenshots; no auth dependency.
- **Depends on:** Goal 5

### Goal 11b — Price Alerts ✅ MERGED
- **TRD:** `trds/goal11b-price-alerts.md` — status: done
- **PR:** #20 merged 2026-08-01
- **Why:** Re-engages users when watched product costs shift beyond their threshold.
- **Depends on:** Goal 10, Goal 11a

### Goal 12 — Enhanced Search & Discovery 🔄 IN REVIEW
- **TRD:** `trds/goal12-enhanced-search-discovery.md` — status: done
- **PR:** #23 — READY FOR REVIEW (452 tests pass)
- **Why:** Better top-of-funnel discovery: search autocomplete, trending, markup filters, recent searches.
- **Depends on:** Goal 5, Goal 8, Goal 9

### Goal 13 — Weekly Digest Email 🔄 IN REVIEW
- **TRD:** `trds/goal13-weekly-digest-email.md` — status: done
- **PR:** #24 — READY FOR REVIEW (418 tests pass)
- **Why:** Re-engages users with a weekly email summary of their watched products and trending items.
- **Depends on:** Goal 10, Goal 11b, Goal 12
