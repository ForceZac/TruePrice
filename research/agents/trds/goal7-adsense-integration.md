# TRD: Goal 7 — AdSense Integration & Required Pages

- **status:** `ready`
- **goal:** `Goal 7`
- **priority:** `P1`
- **branch:** `task/goal7-adsense-integration`
- **estimated_effort:** `Medium`
- **depends_on:** `Goal 6`

## Description

Add the legal/policy pages (Privacy Policy, Terms, About, Contact), site footer, Google AdSense
auto-ads integration, manual ad units on high-value pages, and a GDPR cookie consent banner.
These are required before submitting TruePrice to AdSense for review and before the site can
generate any revenue. No new DB migrations or API endpoints are needed.

## Acceptance Criteria

- [ ] `/privacy` page exists with: cookie/AdSense disclosure, what data TruePrice collects, link to Google's privacy policy
- [ ] `/terms` page exists with: estimate disclaimer, no-warranty notice, contact link
- [ ] `/about` page exists with: project description, methodology overview, author info; Organization JSON-LD
- [ ] `/contact` page exists with a working mailto link
- [ ] Site footer renders on all pages with links to `/privacy`, `/terms`, `/about`, `/contact`
- [ ] AdSense script loads via `next/script` with `strategy="afterInteractive"` in `app/layout.tsx`; publisher ID via env var `NEXT_PUBLIC_ADSENSE_CLIENT`
- [ ] AdSense script is NOT loaded if user declined cookie consent
- [ ] Product page has one `<AdSlot>` below the cost breakdown with fixed min-height (CLS prevention)
- [ ] Category page has one `<AdSlot>` injected after the 6th product card
- [ ] Cookie consent banner appears on first visit (all users); stores choice in `localStorage` key `cookie_consent`
- [ ] `/robots.txt` is served by Next.js and does not block Googlebot or AdSense crawlers
- [ ] Privacy and Terms pages are `noindex`; About is indexed
- [ ] TypeScript compiles clean
- [ ] Vitest tests: Footer links, AdSlot renders, CookieConsent accept/decline behavior

## Technical Notes

- `NEXT_PUBLIC_ADSENSE_CLIENT` already defined in `env.ts` — use that; don't rename
- `AdSenseLoader` client component in `src/components/layout/AdSenseLoader.tsx` — reads consent from localStorage, conditionally renders `<Script>`; dispatches/listens on custom `cookie-consent-change` window event
- `AdSlot` component in `src/components/atoms/AdSlot.tsx` — `'use client'`; wraps `<ins class="adsbygoogle">` with `min-height: 90px` wrapper; calls `adsbygoogle.push({})` in `useEffect`
- `CookieConsent` in `src/components/molecules/CookieConsent.tsx` — `'use client'`; banner at bottom of screen; accept/decline buttons; dispatches `cookie-consent-change` event
- `Footer` in `src/components/layout/Footer.tsx` — server component; links to policy pages
- Policy pages: `app/privacy/page.tsx`, `app/terms/page.tsx`, `app/about/page.tsx`, `app/contact/page.tsx`
- `app/robots.ts` — Next.js Metadata Robots route; allow all; reference sitemap URL
- Product page ad: below `<section aria-labelledby="cost-heading">`, before closing `<main>`
- Category page ad: inside product list loop after index 5, using `React.Fragment` with key
- Privacy/Terms: add `export const metadata = { robots: { index: false } }` for noindex
- About: add Organization JSON-LD schema

## Tasks

1. Write TRD (this file)
2. Add `src/components/layout/Footer.tsx`
3. Add `src/components/atoms/AdSlot.tsx`
4. Add `src/components/layout/AdSenseLoader.tsx`
5. Add `src/components/molecules/CookieConsent.tsx`
6. Add `app/privacy/page.tsx`
7. Add `app/terms/page.tsx`
8. Add `app/about/page.tsx`
9. Add `app/contact/page.tsx`
10. Update `src/app/layout.tsx` — add Footer, CookieConsent, AdSenseLoader
11. Update `src/app/product/[id]/page.tsx` — add AdSlot below cost section
12. Update `src/app/category/[slug]/page.tsx` — add AdSlot after 6th product card
13. Add `src/app/robots.ts`
14. Write Vitest tests for Footer, AdSlot, CookieConsent
15. Run `tsc --noEmit` and `vitest run`; fix any failures
