# PRD: Goal 7 — AdSense Integration & Required Pages

- **Goal reference:** Goal 7 — AdSense Integration & Required Pages (roadmap: implementation-roadmap-v2.md)
- **Status:** Draft
- **Priority:** P1
- **Depends on:** Goal 6 (Category Browsing & Landing Pages)
- **Blocks:** Goal 8 (Data Expansion & Accuracy Improvements)

---

## Problem Statement

TruePrice needs revenue to be sustainable. Google AdSense is the lowest-friction monetization option for a content site at this stage — no sales team, no sponsors, no paywalls. It activates once the site has enough real content and meets Google's publisher policies.

Before AdSense can approve the site, Google requires: (1) real, unique content (covered by Goals 5–6), (2) a Privacy Policy page that discloses cookie/data use, (3) no policy violations (adult content, scraped content, etc.). Without these pages and the integration code, revenue is $0 regardless of how much traffic the site receives.

This goal closes the gap: add the policy/legal pages, wire up AdSense auto-ads, and place manual ad units in high-value positions. It also establishes the site structure (About, Contact) that makes TruePrice feel like a real product rather than a side project.

---

## User Stories

1. **As a site visitor**, I want to see ads that are relevant and non-intrusive — not a wall of banners that makes the page unusable — so I continue using TruePrice rather than bouncing.

2. **As a user concerned about privacy**, I want to read a plain-English Privacy Policy that tells me what data is collected and how it's used — so I can make an informed decision about using the site.

3. **As a first-time visitor who wonders if TruePrice is legit**, I want to find an About page that explains what the project is, who built it, and how estimates work — so I trust the data.

4. **As Zach submitting TruePrice for AdSense review**, I want a site that passes Google's publisher policy checklist on the first submission — so I don't lose weeks to a rejection and resubmission cycle.

5. **As a user on mobile**, I want ads that don't cause layout shift, cover content, or slow the page load — the experience should remain fast and usable with ads present.

---

## Requirements

### Must-Have

- **Privacy Policy page** (`/privacy`) — must disclose: use of Google AdSense (which uses cookies and interest-based advertising), what data TruePrice collects (none beyond standard server logs for v1), and a link to Google's privacy policy. Plain English, not legalese.
- **Terms of Service page** (`/terms`) — covers: estimates are approximate, not financial/legal advice; site provided as-is; no warranty on accuracy; links to contact.
- **About page** (`/about`) — explains: what TruePrice is, how estimates work (at a high level), who built it. Should feel human. Link from footer and nav.
- **Contact page** (`/contact`) — displays contact email (or a simple mailto link). Required by AdSense policy for sites without user accounts.
- **Footer update** — add links to Privacy Policy, Terms, About, Contact on every page via the site footer
- **Google AdSense auto-ads** — add the AdSense `<script>` tag to `app/layout.tsx` (via Next.js `<Script strategy="afterInteractive">`). Auto-ads handle placement automatically for initial launch.
- **Manual ad unit — product page** — place one `<ins class="adsbygoogle">` leaderboard or rectangle unit in the product page layout (below the cost breakdown, above "More in [Category]"). Labeled "Advertisement" per AdSense policy.
- **Manual ad unit — category page** — place one ad unit within the product list (e.g., after the 6th product card). Must not obscure content or trigger CLS.
- **Consent banner (EU/UK)** — display a simple cookie consent notice for EU/UK visitors (required for GDPR compliance with AdSense). Can use a lightweight library. Consent state stored in localStorage; if declined, do not load AdSense script.
- **robots.txt** — ensure it does not block Googlebot or AdSense crawler. Verify `/robots.txt` is served correctly by Next.js.

### Should-Have

- **AdSense reporting integration** — document in a README or internal note which AdSense unit IDs map to which placements (for future reporting analysis)
- **Ad slot components** — encapsulate each ad placement in a reusable `<AdSlot>` component that handles: script load check, "Advertisement" label, responsive sizing, and CLS prevention (fixed min-height wrapper)
- **`noindex` on policy pages** — Privacy Policy and Terms pages can be `noindex` since they add no SEO value; About page should be indexed
- **Structured data on About page** — `Organization` JSON-LD schema with site name, URL, and description to reinforce brand signals to Google

### Won't-Have (v1)

- Paid/premium tier or ad-free experience
- Affiliate links or sponsored product placements
- AdSense experiments or A/B testing ad placements
- Server-side ad rendering — AdSense is client-side only
- Custom consent management platform (CMP) — use a lightweight solution for v1
- Analytics beyond AdSense (e.g., GA4) — deferred; no tracking beyond what AdSense auto-provides

---

## Acceptance Criteria

- [ ] `/privacy` page exists with content that covers: cookie use, AdSense disclosure, data collected, Google's privacy policy link
- [ ] `/terms` page exists with: estimate disclaimer, no-warranty notice, contact link
- [ ] `/about` page exists with: project description, methodology overview, author info
- [ ] `/contact` page exists with a working contact mechanism (mailto link acceptable for v1)
- [ ] Site footer renders on all pages and includes links to `/privacy`, `/terms`, `/about`, `/contact`
- [ ] AdSense `<script>` loads via `next/script` with `strategy="afterInteractive"` in `app/layout.tsx`; publisher ID configured via env var (`NEXT_PUBLIC_ADSENSE_PUB_ID`)
- [ ] Product page has one manual ad unit placed below the cost breakdown; ad slot has a fixed min-height to prevent CLS
- [ ] Category page has one manual ad unit injected into the product list after card 6
- [ ] Cookie consent banner appears for users in EU/UK (detected via `Accept-Language` or Cloudflare geo header); AdSense script is not loaded if consent is declined
- [ ] `/robots.txt` does not block Googlebot or AdSense crawlers
- [ ] Lighthouse performance score does not drop more than 5 points from Goal 5 baseline after ads are added
- [ ] No layout shift (CLS > 0.1) caused by ad slots on product or category pages
- [ ] TypeScript compiles clean
- [ ] Ad slots render in development without errors (AdSense returns a test ad or blank; no console errors from missing publisher ID)

---

## Technical Notes

- **Tech stack:** Next.js 15 App Router, TypeScript, Tailwind CSS, shadcn/ui — same as previous goals
- **AdSense script loading:** Use `next/script` with `strategy="afterInteractive"` to avoid blocking page render. Do NOT put it in `<head>` directly.
- **Publisher ID:** Store as `NEXT_PUBLIC_ADSENSE_PUB_ID` in `.env.local` and Vercel env vars. The `ca-pub-XXXXXXXX` ID comes from the AdSense dashboard once the account is created.
- **Ad slot component:** `src/components/atoms/AdSlot.tsx` — accepts `slotId`, `format`, `responsive` props. Wraps `<ins>` in a `div` with `min-height: 90px` (or appropriate for format) to prevent CLS. Calls `(adsbygoogle = window.adsbygoogle || []).push({})` in a `useEffect`.
- **Consent banner:** `src/components/molecules/CookieConsent.tsx` — lightweight, no third-party library required. Check `navigator.language` or a geo header (Vercel provides `x-vercel-ip-country`) to detect EU/UK. Store consent in `localStorage` key `cookie_consent`. If `"denied"`, skip loading AdSense script.
- **Policy page content:** Write as `.tsx` files (not markdown) to allow future styling. Content can be prose within a simple `<article>` layout. No CMS needed for v1.
- **New pages:**
  - `app/privacy/page.tsx`
  - `app/terms/page.tsx`
  - `app/about/page.tsx`
  - `app/contact/page.tsx`
- **Footer component:** `src/components/layout/Footer.tsx` — added to `app/layout.tsx` below the main content. Tailwind styled, minimal.
- **No new DB migrations or API endpoints needed for this goal**

---

## Open Questions

1. **AdSense account:** ⏳ Zach action required — create a Google AdSense account and obtain `ca-pub-XXXXXXXX`. Site was submitted for review post-Goal 7 merge. No resolution from the agent side. Tracked as Q7-1.

2. **Ad unit IDs:** ✅ Resolved — launch with auto-ads only. Manual ad unit IDs can be added to the `AdSlot` components after AdSense approval without a code change (env vars `NEXT_PUBLIC_ADSENSE_SLOT_BANNER` and `NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR` are already wired up per PROJECT_KEYS.md section 7).

3. **Privacy Policy scope:** ✅ Resolved — as of Goal 10 (User Accounts), TruePrice begins storing user PII (email, name, OAuth tokens). The Privacy Policy at `/privacy` must be updated before Goal 10 ships to disclose: (a) email address collected for authentication, (b) Google OAuth data (profile info), (c) watchlist data stored server-side. For Goals 1–9 (no user accounts), TruePrice stores no user PII beyond standard server logs + AdSense cookies; the current policy is accurate. Tracked as Q7-3 — Zach to review updated policy before Goal 10 launch.

4. **Consent banner scope:** ✅ Resolved — Vercel Edge Network provides `x-vercel-ip-country` header. The site is deployed on Vercel, so `CookieConsent.tsx` can use this header in middleware or a server component to detect EU/UK visitors reliably.

5. **CLS budget:** ✅ Resolved — `AdSlot` component uses a fixed `min-height` wrapper (`min-h-[90px]` for banner, `min-h-[250px]` for rectangle) that reserves space before the AdSense script loads, preventing CLS. Confirmed implemented in PR #12.
