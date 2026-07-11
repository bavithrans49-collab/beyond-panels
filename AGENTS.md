# Beyond Panels — Dev Notes

## Admin Login
- Email: bavithrans49@gmail.com
- Password: 25233001

## Architecture
- **Hosting**: Vercel (free tier)
- **Database**: Supabase PostgreSQL (free tier, 500MB)
- **File Storage**: Cloudflare R2 (free tier, 10GB)
- **Auth**: NextAuth v4 (credentials) + Gmail SMTP for OTP
- **Payments**: Razorpay (optional) + QR self-confirm fallback

## Setup Steps (first time)

### 1. Supabase
1. Go to https://supabase.com → Sign up → Create a project
2. Under **Project Settings → Database → Connection string**, copy the URI
3. Replace `DATABASE_URL` in `.env` with your connection string (use the `?pgbouncer=true` variant)
4. Run: `npx prisma db push` (creates all tables)
5. Run: `npx prisma db seed` (creates admin account)

### 2. Cloudflare R2
1. Go to Cloudflare Dashboard → R2 → Create bucket named `beyond-panels`
2. Under bucket **Settings → Public Access** → Enable public access → Copy the public URL
3. Go to **R2 → Manage API Tokens** → Create API token with **read+write** permissions
4. Fill in `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_PUBLIC_URL` in `.env`

### 3. Vercel Deploy
1. Push repo to GitHub
2. Go to https://vercel.com → Import repo → Set Framework = Next.js
3. Add all `.env` variables in Vercel project settings (including `NEXTAUTH_URL` = your deployed URL)
4. Deploy

## Environment Variables (.env)
- `DATABASE_URL` — Supabase PostgreSQL connection string
- `NEXTAUTH_URL` — your app URL (http://localhost:3000 for dev, https://your-app.vercel.app for prod)
- `NEXTAUTH_SECRET` — random secret for session encryption
- `GMAIL_USER` — Gmail address for sending verification OTPs
- `GMAIL_APP_PASSWORD` — Gmail App Password
- `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` — Razorpay test/live keys (optional)
- `R2_ACCOUNT_ID` — Cloudflare account ID (from R2 dashboard)
- `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` — R2 API token
- `R2_BUCKET_NAME` — bucket name (default: `beyond-panels`)
- `R2_PUBLIC_URL` — public bucket URL (e.g. `https://pub-xxxxx.r2.dev`)

## Registration Flow
1. User fills email → POST `/api/auth/send-verification`
2. Server sends 6-digit OTP via Gmail SMTP
3. User enters OTP → POST `/api/auth/verify-code`
4. User enters name + password → POST `/api/auth/complete-registration`
5. Account created, auto-login

## Database
- PostgreSQL via Supabase
- After schema changes: `npx prisma db push`
- Run `npx prisma db seed` to reset/create admin

## File Uploads (Cloudflare R2)
- Comics: cover image + PDF/pages uploaded directly to R2 bucket
- Files stored at `[comicId]/cover.[ext]`, `[comicId]/comic.pdf`, `[comicId]/pages/page-*.ext`
- URLs stored in DB as full R2 public URLs
- Delete removes files from R2 + DB records

## Store Page — Already Owned
- `src/app/comic/[id]/page.tsx` checks session + confirmed purchase
- Passes `isOwned` boolean to `ComicDetailClient`
- If owned: shows "✓ IN YOUR LIBRARY" button (navigates to `/library`) instead of "BUY NOW"

## Reader — Review Popup
- Image reader (`src/app/reader/[id]/page.tsx`): on last page, right arrow changes to "RATE ★" button
- PDF viewer (`src/components/pdf-viewer.tsx`): accepts `onFinish` prop, shows RATE button on last page
- Popup: rating stars + optional comment → POST `/api/review` → confirms purchase required
- Preview mode never shows the review popup

## Admin Panel — Stats & Reviews
- 5 stat cards: Total Comics, Total Sales, Revenue, Accounts, Pending
- Reviews tab: table of all reviews (comic, user, rating, comment, date)
- Users tab: table of all registered accounts (name, email, role, join date)
- `GET /api/admin/users` — returns `{ count, users[] }`
- `GET /api/admin/reviews` — returns all reviews with user+comic info

## PDF Serving
- `GET /api/comic-pdf/[id]` fetches PDF from R2, checks auth + purchase
- Returns PDF binary with correct headers (not a redirect to R2)
