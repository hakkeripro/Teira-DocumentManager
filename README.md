# TEIRA Document Manager (Sprint 1)

Sprint 1 deliverable (Managed SaaS baseline):
- Next.js App Router (TS)
- Supabase Auth (sessions via cookies)
- Multi-tenant (`company_id`) scope in DB
- Areas → Projects → Documents
- Publish revisions (A..Z) + placeholder PDF generation
- Storage adapter: local filesystem or Supabase Storage

## Prereqs
- Node.js 18+ (or 20+)
- Docker (recommended for local Postgres)
- A Supabase project (for Auth). DB can be local Postgres for dev.

## 1) Configure env
Copy example:
```bash
cp .env.example .env
```

Required (Auth):
```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

Database (choose one):
- **Local Postgres (recommended on Windows if IPv6 connectivity is limited)**
  - Use `docker-compose.dev.yml` (below), then set:
  ```env
  DATABASE_URL="postgresql://teira:teira@localhost:55432/teira?schema=public"
  ```
- **Managed Postgres** (e.g., Supabase / Neon / etc.)
  - Set `DATABASE_URL` accordingly.

Storage:
```env
# local | supabase
STORAGE_PROVIDER=local
# if supabase:
SUPABASE_STORAGE_BUCKET=teira-assets
SUPABASE_SERVICE_ROLE_KEY=...
```

## 2) Local Postgres (Docker)
Start dev DB:
```bash
docker compose -f docker-compose.dev.yml up -d
```

Stop:
```bash
docker compose -f docker-compose.dev.yml down
```

## 3) Install + migrate + run
```bash
npm install
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

Open:
- http://localhost:3000/login

### First-run flow (Sprint 1)
1) Sign up / sign in
2) Go to **/onboarding** and create tenant (company)
3) Create Area → Create Project
4) Project → Documents → Publish → Open PDF
5) Publish again → revision increments (B, C, ...)

## Tests / “green pipeline”
```bash
npm run lint
npm run typecheck
npm run build
```

## Notes
- Supabase Auth email confirmation can block sign-in if enabled. In dev you can disable it in Supabase Dashboard, or configure Auth URL settings (Site URL / Redirect URLs).
- Supabase free-tier Postgres may be IPv6-only; if your network does not support IPv6, use local Postgres for dev.

## Production / SaaS
See `docs/09_PRODUCTION_SAAS.md`.
