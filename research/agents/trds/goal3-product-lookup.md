# TRD: Goal 3 — Product Lookup (Search + Barcode)

- **status:** `ready`
- **goal:** `Goal 3`
- **priority:** `P0`
- **branch:** `task/goal3-product-lookup`
- **estimated_effort:** `Large`
- **depends_on:** `Goal 1`

## Description

Build the product lookup system: barcode scanning via phone camera, manual UPC entry, and text search. Integrate external product databases (Open Food Facts, UPCitemdb) and cache results locally.

## Acceptance Criteria

- [ ] BarcodeService implemented in `src/services/BarcodeService.ts`
- [ ] ProductService implemented in `src/services/ProductService.ts`
- [ ] Camera-based barcode scanning works on mobile browsers (html5-qrcode)
- [ ] Manual UPC/EAN entry field with validation
- [ ] Text search by product name
- [ ] Products looked up from external APIs:
  - Open Food Facts (food/beverage — no API key needed)
  - UPCitemdb (general products — free tier: 100 req/day)
- [ ] Product data cached in PostgreSQL after first lookup
- [ ] Product detail page at `/product/[id]` with basic info (name, brand, category, ingredients, weight, origin)
- [ ] Search results page at `/search?q=<query>` with product cards
- [ ] API routes:
  - `POST /api/products/lookup` — lookup by UPC/EAN
  - `GET /api/products/search?q=<query>` — text search
  - `GET /api/products/[id]` — get cached product by ID
- [ ] Mobile camera scanning is smooth — opens quickly, scans reliably, handles permissions gracefully
- [ ] Graceful handling when product is not found in any external database
- [ ] Loading states and error states for all async operations

## Barcode Scanner Implementation

Use `html5-qrcode` library:
```
npm install html5-qrcode
```

Create a `BarcodeScanner` client component that:
- Requests camera permission
- Opens rear camera by default on mobile
- Scans UPC-A, UPC-E, EAN-8, EAN-13 formats
- Returns the decoded barcode string
- Shows clear instructions and error states
- Has a "type it instead" fallback link to manual entry

## External API Integration

### Open Food Facts (food/beverage)
- Base URL: `https://world.openfoodfacts.org/api/v2/product/{barcode}.json`
- No API key required
- Returns: product name, brand, ingredients list, nutrition facts, image, categories, countries
- Rate limit: be polite, cache aggressively

### UPCitemdb (general products)
- Base URL: `https://api.upcitemdb.com/prod/trial/lookup?upc={barcode}`
- Free tier: 100 req/day (trial endpoint)
- Returns: title, description, brand, category, images, EAN/UPC
- For higher volume: paid API key via `UPCITEMDB_API_KEY`

### Lookup Strategy
1. Check local cache (PostgreSQL) first by UPC/EAN
2. If not cached and looks like food (starts with certain prefixes): try Open Food Facts
3. If not cached or not food: try UPCitemdb
4. If found: cache in Product table, parse ingredients/materials, return
5. If not found anywhere: return "product not found" with option to submit manually

## Material Extraction

When a product is found, attempt to extract materials:
- **Food:** parse ingredient list into individual ingredients, match against Material table
- **Clothing:** parse material composition ("60% cotton, 40% polyester") into materials + percentages
- **Electronics:** no auto-extraction — rely on manual teardown data or community submissions
- **Cosmetics:** parse INCI ingredient list

Create `src/lib/material-parser.ts` with parsers per category.

## Tasks

1. Install `html5-qrcode`
2. Create `BarcodeScanner` client component in `src/components/molecules/BarcodeScanner.tsx`
3. Create `SearchInput` component in `src/components/molecules/SearchInput.tsx`
4. Implement `src/services/BarcodeService.ts` — external API integration layer
5. Implement `src/services/ProductService.ts` — lookup orchestration + caching
6. Create `src/lib/material-parser.ts` — extract materials from ingredient/composition text
7. Create API routes:
   - `src/app/api/products/lookup/route.ts`
   - `src/app/api/products/search/route.ts`
   - `src/app/api/products/[id]/route.ts`
8. Create `/search` page with SearchInput + results grid
9. Create `/product/[id]` page with basic product info
10. Create `/scan` page with BarcodeScanner component
11. Write tests:
    - Material parser tests (food ingredients, textile compositions)
    - Product lookup API integration tests (mock external APIs)
    - Search functionality tests
12. Test barcode scanning on a real phone

## Notes

- Open Food Facts is the priority for food — it's free and unlimited.
- UPCitemdb free tier is only 100 req/day — cache aggressively to avoid hitting the limit.
- The material parser is best-effort — some products will have unparseable ingredients. That's OK — confidence score (Goal 4) will reflect this.
- Camera permission denial should show a clear message with the manual entry fallback, not crash.
