# AI Nutrition Checker Pro

Production-ready Next.js App Router application with real authentication, PostgreSQL persistence, OpenAI nutrition analysis, Razorpay premium billing, RBAC, admin analytics, and secure API design.

## Folder structure

- `app/` App router pages + API routes
  - `app/(dashboard)/dashboard/page.tsx` dashboard with text/image analysis, Razorpay checkout, PDF export, charts
  - `app/api/auth/register/route.ts` email/password signup
  - `app/api/auth/[...nextauth]/route.ts` NextAuth handlers
  - `app/api/analyze/text/route.ts` text nutrition endpoint
  - `app/api/analyze/image/route.ts` image nutrition endpoint
  - `app/api/payment/order/route.ts` Razorpay order creation
  - `app/api/payment/verify/route.ts` Razorpay signature verification + premium upgrade
  - `app/api/diet-plan/route.ts` premium personalized diet planning
  - `app/api/admin/stats/route.ts` admin analytics
  - `app/api/admin/ban/route.ts` admin moderation
- `lib/` reusable backend modules (auth, OpenAI, rate-limit, security, usage, env validation)
- `prisma/schema.prisma` complete relational schema
- `middleware.ts` security headers + route protection

## Database schema (Prisma)

Models:
- User
- Subscription
- Payment
- AnalysisHistory
- UsageLog
- NextAuth Account / Session / VerificationToken

RBAC roles: `FREE`, `PREMIUM`, `ADMIN`, `BANNED`.

## Real integrations

### Auth
- NextAuth JWT session strategy
- Email/password credentials flow (bcrypt hash)
- Google OAuth provider
- HTTP-only NextAuth cookies
- Role attached to JWT + session

### OpenAI
- Backend-only calls in `lib/openai.ts`
- Text + image endpoints with strict Zod response parsing

### Razorpay
- Backend order creation
- Frontend checkout trigger
- Backend HMAC signature verification
- Payment record persistence
- User promotion to `PREMIUM`

## Deployment (Vercel)

1. Set environment variables from `.env.example` in Vercel Project Settings.
2. Configure PostgreSQL (Neon/RDS/Supabase).
3. Run migrations:
   - `npx prisma migrate deploy`
4. Build/deploy:
   - `npm run build`

## Local setup

1. `npm install`
2. Copy env: `cp .env.example .env.local`
3. `npx prisma migrate dev`
4. `npm run dev`

## Security checklist

- [x] Env schema validation via Zod
- [x] API input validation via Zod
- [x] Password hashing via bcrypt
- [x] JWT auth strategy with protected routes
- [x] Rate limiting for analysis APIs
- [x] Secure headers via middleware
- [x] Role-based authorization on server endpoints
- [x] Razorpay signature verification server-side
- [x] Secrets only in backend env vars
- [x] No OpenAI key exposed in frontend

## Notes

- Barcode scanner endpoint structure is future-ready by separating source-specific analysis APIs.
- For production-grade distributed rate limiting, replace in-memory limiter with Redis/Upstash.
