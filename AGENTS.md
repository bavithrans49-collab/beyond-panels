# Beyond Panels — Dev Notes

## Admin Login
- Email: bavithrans49@gmail.com
- Password: 25233001

## Architecture
- **Hosting**: Vercel (free tier)
- **Database**: Supabase PostgreSQL (free tier, 500MB)
- **File Storage**: Supabase Storage (free tier, 1GB)
- **Auth**: NextAuth v4 (credentials) + Gmail SMTP for OTP
- **Payments**: Razorpay (optional) + QR self-confirm fallback

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

## File Uploads (Supabase Storage)
- Comics: cover image + PDF/pages uploaded to Supabase Storage bucket
- Files stored at `[comicId]/cover.[ext]`, `[comicId]/comic.pdf`, `[comicId]/pages/page-*.ext`
- URLs stored in DB as full Supabase Storage public URLs
- Uses `service_role` key for admin upload/delete (never exposed to client)
- Delete removes files from Storage + DB records

## PDF Serving
- `GET /api/comic-pdf/[id]` fetches PDF from Supabase Storage, checks auth + purchase
- Returns PDF binary (not a redirect), streamed through the API

## Environment Variables
| Variable | Source |
|---|---|
| `DATABASE_URL` | Supabase → Project Settings → Database → Connection string |
| `NEXTAUTH_URL` | Your app URL (`http://localhost:3000` or `https://your-app.vercel.app`) |
| `NEXTAUTH_SECRET` | Any random string |
| `GMAIL_USER` | Your Gmail address |
| `GMAIL_APP_PASSWORD` | Gmail App Password |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | Razorpay dashboard (optional) |
| `SUPABASE_PROJECT_REF` | Supabase project URL subdomain (e.g. `hrtgrzrvdyvbkzjawvnl`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API → service_role key |
| `SUPABASE_STORAGE_BUCKET` | Storage bucket name (default: `beyond-panels`) |

## Features
- **Store "Already Owned"**: Comic detail page shows "IN YOUR LIBRARY" if user already purchased
- **Reader Review Popup**: On last page, a "RATE ★" button opens review modal (rating + comment)
- **Admin Dashboard**: 5 stat cards (Comics, Sales, Revenue, Accounts, Pending) + tabs for Sales, Comics, Reviews, Users
