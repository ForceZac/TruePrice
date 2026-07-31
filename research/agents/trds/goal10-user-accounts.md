# TRD: Goal 10 — User Accounts & Personalization

- **status:** `ready`
- **goal:** `Goal 10`
- **priority:** `P1`
- **branch:** `task/goal10-user-accounts`
- **estimated_effort:** `Large`
- **depends_on:** `Goal 5, Goal 9`

## Description

Add lightweight authentication (Google OAuth + magic-link email via NextAuth v5) and a personal product watchlist. Users can save products, view a dashboard of saved products and recently viewed items, receive a weekly email digest when watched product estimates change, and delete their account.

## Acceptance Criteria

- [ ] User can sign in with Google OAuth; session persists across browser closes (persistent JWT cookie)
- [ ] User can sign in via magic-link email; link expires in 15 minutes
- [ ] `POST /api/user/watchlist` with valid `productId` saves a `SavedProduct` row; returns 409 if already saved
- [ ] `DELETE /api/user/watchlist/[productId]` removes the row; returns 404 if not saved
- [ ] Save button on product page shows filled/unfilled state reflecting watchlist membership; updates optimistically on click
- [ ] `/dashboard` renders for authenticated users: saved products list + recently viewed list
- [ ] `/dashboard` redirects unauthenticated users to `/login?next=/dashboard`
- [ ] Recently viewed products sync from localStorage to DB on sign-in (merge + dedup, cap 10)
- [ ] Product page views write a `RecentlyViewed` row for authenticated users (one write per product per session)
- [ ] `/dashboard/settings` shows account info and a "Delete account" button with confirmation dialog
- [ ] Account deletion removes `User`, all `SavedProduct`, all `RecentlyViewed`; session invalidated
- [ ] `GET /api/user/watchlist` returns 401 for unauthenticated requests
- [ ] All new API routes return appropriate status codes
- [ ] TypeScript compiles clean
- [ ] `GET /api/cron/weekly-digest` identifies products with >5% markup change in last 7 days and sends email to users with those products saved (real send gated by `RESEND_API_KEY`)
- [ ] Unit tests: watchlist CRUD, recently-viewed merge logic, digest query logic
- [ ] Soft nudge banner on product pages for signed-out users ("Sign in to save this product")

## New Dependencies

- `next-auth@5` — authentication (App Router native)
- `@auth/prisma-adapter` — Prisma adapter for NextAuth
- `resend` — transactional email for weekly digest

## New Prisma Models

```prisma
model User {
  id            String          @id @default(cuid())
  name          String?
  email         String?         @unique
  emailVerified DateTime?
  image         String?
  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt

  accounts      Account[]
  sessions      Session[]
  savedProducts SavedProduct[]
  recentlyViewed RecentlyViewed[]
}

model Account {
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@id([provider, providerAccountId])
  @@index([userId])
}

model Session {
  sessionToken String   @unique
  userId       String
  expires      DateTime

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}

model VerificationToken {
  identifier String
  token      String
  expires    DateTime

  @@id([identifier, token])
}

model SavedProduct {
  userId    String
  productId String
  savedAt   DateTime @default(now())

  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  product Product @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@id([userId, productId])
  @@index([userId])
}

model RecentlyViewed {
  userId    String
  productId String
  viewedAt  DateTime @default(now())

  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  product Product @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@id([userId, productId])
  @@index([userId])
  @@index([viewedAt])
}
```

## New env vars

Server (`env.server.ts`):
- `NEXTAUTH_SECRET` — JWT signing key (required in prod)
- `GOOGLE_CLIENT_ID` — Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` — Google OAuth client secret
- `RESEND_API_KEY` — Resend API key (optional; email gated on presence)
- `FROM_EMAIL` — sender address for digest emails (default: `digest@trueprice.app`)

Client (`env.client.ts`):
- (no new client env vars; NextAuth exposes session via `useSession`)

## Tasks

### 1. Install dependencies
```
npm install next-auth@5 @auth/prisma-adapter resend
```

### 2. Prisma: add User/Account/Session/VerificationToken/SavedProduct/RecentlyViewed models
- Add models above to `prisma/schema.prisma`
- Add `savedProducts SavedProduct[]` and `recentlyViewed RecentlyViewed[]` relations to `Product`
- Create migration: `20260731000001_goal10_user_accounts`

### 3. env.server.ts: add NEXTAUTH_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, RESEND_API_KEY, FROM_EMAIL

### 4. src/lib/auth.ts — NextAuth v5 config
- Providers: `Google`, `Resend` (magic-link)
- Adapter: `PrismaAdapter(db)`
- Session strategy: `jwt`
- Callbacks: `session` callback to add `user.id` to session

### 5. app/api/auth/[...nextauth]/route.ts — NextAuth handler
- Re-export `{ GET, POST }` from `@/lib/auth`

### 6. src/services/UserService.ts — domain service
- `getWatchlist(userId)` → `SavedProduct[]` with product details
- `addToWatchlist(userId, productId)` → `SavedProduct` or throws if at cap (50)
- `removeFromWatchlist(userId, productId)` → void
- `isInWatchlist(userId, productId)` → boolean
- `getRecentlyViewed(userId, limit = 10)` → `RecentlyViewed[]` with product details
- `recordProductView(userId, productId)` → upsert `RecentlyViewed`
- `mergeLocalRecentlyViewed(userId, localProductIds: string[])` → upsert all, dedup, cap 10
- `getDigestCandidates(since: Date, minChangePercent = 5)` → products with markup change above threshold with their watchlist users
- `deleteAccount(userId)` → `$transaction` delete all user data + user row

### 7. API routes

#### GET/POST /api/user/watchlist
- `GET`: return current user's watchlist (401 if unauthenticated)
- `POST`: add product to watchlist; 409 if duplicate; 400 if missing productId

#### DELETE /api/user/watchlist/[productId]
- Remove from watchlist; 404 if not found; 401 if unauthenticated

#### GET/POST /api/user/recent
- `GET`: return recently viewed (up to 10)
- `POST`: record a product view; body `{ productId, localIds? }` for merge-on-signin

#### DELETE /api/user
- Hard delete account; invalidate session; 401 if unauthenticated

#### GET /api/cron/weekly-digest
- Protected by `CRON_SECRET` header
- Query: products in user watchlists whose markup changed >5% in last 7 days
- Send email via Resend; skip send if `RESEND_API_KEY` not set (log only)
- Return summary: `{ usersNotified, productsIncluded }`

### 8. UI components

#### src/components/atoms/SaveButton.tsx
- Client component
- Props: `{ productId: string }`
- Uses `useWatchlist(productId)` hook for state
- Optimistic update on click
- Shows bookmark icon (filled = saved, outline = unsaved)
- Shows sign-in nudge if unauthenticated

#### src/hooks/useWatchlist.ts
- TanStack Query hook
- `useWatchlist(productId)` — query `/api/user/watchlist` and return boolean + mutation fns
- Mutations: `save` / `unsave` with optimistic updates

### 9. Pages

#### app/login/page.tsx
- Server component
- Google sign-in button
- Email input for magic-link
- Redirect to `?next` param after auth

#### app/dashboard/page.tsx
- Server component
- Requires auth → redirect to `/login?next=/dashboard`
- Shows saved products grid and recently viewed row

#### app/dashboard/settings/page.tsx
- Shows account info (name, email, provider)
- "Delete account" button → confirmation dialog → `DELETE /api/user`

### 10. Update vercel.json
- Add weekly digest cron: `{ "path": "/api/cron/weekly-digest", "schedule": "0 9 * * 1" }`

### 11. Tests (Vitest)
- `src/services/__tests__/UserService.test.ts`
  - watchlist add/remove/cap enforcement
  - `mergeLocalRecentlyViewed` dedup + cap
  - `getDigestCandidates` returns correct products
  - `deleteAccount` cascade

## Open Questions (defaults accepted for implementation)

- Q10-1: Using NextAuth v5 (App Router native) — recommended, proceeding
- Q10-2: Google + magic-link email only (no GitHub for v1)
- Q10-3: Watchlist cap = 50 (soft limit, warning at 45)
- Q10-4: Digest is opt-out (on by default); unsubscribe link in every email — deferred to v2 since email MVP is sending only
- Q10-5: Merge + deduplicate by productId, keep most-recent viewedAt, cap at 10
