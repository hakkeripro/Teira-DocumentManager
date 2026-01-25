# Tech Stack v1.3 (Teira DocumentManager, Managed SaaS)

## Suositus (MVP)
- Frontend: Next.js + TypeScript + TanStack Table
- Backend: Next.js API routes (MVP) tai erillinen API-service (Phase 2/3)
- DB: Managed PostgreSQL + connection pooling (pakollinen serverless/scale)
- ORM: Prisma (tai Drizzle)
- Auth: Supabase Auth (tai Auth0)
- PDF: Playwright/Chromium print-to-PDF (Node runtime)
- Storage: S3-yhteensopiva (Supabase Storage / AWS S3 / Cloudflare R2)

## Production profile (Managed SaaS)
- Environments: dev / staging / prod (erilliset DB:t ja bucketit)
- Observability: Sentry (frontend+backend), structured logs (request-id + company-id)
- Rate limiting + request size limits import-endpointeissa
- DB backups + restore-prosessi (managed)
- Migration strategy: CI/CD ajaa migraatiot tai “migration job” deployn yhteydessä

## Skalautuvuus (kun käyttö kasvaa)
- XML/XLSX import ja PDF-publish siirretään job-queueen:
  - API käynnistää jobin, UI näyttää progressin
  - Worker suorittaa Playwrightin ja isot parse/validoinnit
- Queue: Redis (BullMQ) / managed Redis
- Storage: PDF + XML-exportit assetsina (ei DB blob)

## Sprint 1 implementation notes (Next.js 15)

- App Router route params and `searchParams` are treated as **Promises** in the generated type checks. Pages/route handlers in this repo follow that convention.
- Client-side code must access `NEXT_PUBLIC_*` env vars via **direct property access** (e.g. `process.env.NEXT_PUBLIC_SUPABASE_URL`). Dynamic indexing like `process.env[name]` will be `undefined` in client bundles.

## UI (grid / workbook)
Kytkentäkuvien tavoitetila vaatii excel-tyyppisen gridin (copy/paste) sekä drag/drop-järjestyksen. Toteutuksessa suositaan komponentteja, jotka tukevat determinististä statea ja suuria taulukkoja.
