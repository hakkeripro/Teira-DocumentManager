# Production: Managed SaaS + Skalautuvuus (v1.3, Teira DocumentManager)

## Hard requirements
- Tuotantoversio on **pilvessä (Managed SaaS)**. Ei self-host-vaihtoehtoa MVP:hen.
- Käyttö voi kasvaa merkittävästi → arkkitehtuuri tukee **horisontaalista skaalautumista**.
- EU/GDPR: data säilytetään ensisijaisesti **EU-alueella**.

## Deployment architecture (target)
- Web: Next.js CDN:n takana.
- API: Node runtime (Next API routes aluksi OK) mutta erotettavissa omaksi palveluksi.
- Background jobs: erillinen **worker** pitkäkestoisille tehtäville:
  - XML/XLSX import + validointi
  - PDF publish (Chromium/Playwright)
- Queue: Redis (BullMQ) / managed Redis.
- DB: Managed PostgreSQL (+ pooling).
- Storage: S3-yhteensopiva object storage PDF/XML assets.

## Scaling rules
- Raskaat työt async jobina (UI näyttää progressin).
- API endpointit idempotentteja (publish).
- Pagination + indeksit oletuksena.
- Rate limiting + request size limits.

## Observability & ops
- Sentry / structured logs
- Metrics: job duration, queue depth, pdf time, import failures
- Backups + restore
- Environments: dev / staging / prod

## Sprint 1 implementation notes (dev)

- **Dev DB recommendation:** If your network does not support IPv6 (common on some Windows setups), connecting to Supabase Postgres on the free tier may fail because it can be **IPv6-only**. In that case, use **local Postgres (Docker)** for development and migrate to managed Postgres later (see root README for steps).
- **Storage:** Sprint 1 supports `STORAGE_PROVIDER=local` (writes PDFs under `var/storage/…`) and `STORAGE_PROVIDER=supabase` (Supabase Storage bucket).
- **Auth:** Supabase Auth is used. In dev, you may want to disable email confirmation, or configure Auth URL settings (Site URL / Redirect URLs).

## Worker/queue -valmius
Publish (PDF) ja raskaat generoinnit tulee toteuttaa siten, että ne voidaan myöhemmin siirtää asynkroniseksi (job queue/worker) rikkomatta API-kontraktia.
