# Acceptance Criteria v1.3 (Teira DocumentManager)

## Functional
- Käyttäjä voi kirjautua ja näkee vain oman companyn datan (tenant scope).
- Käyttäjä voi luoda alueen ja projektin.
- Documents-listassa näkyy dokumentit ja viimeisin revisio muodossa `A-XXX`.
- Publish luo uuden revision ja tallentaa PDF assetin (object storage).
- History näyttää revision listan ja mahdollistaa PDF:n avauksen.
- `docs/mapping/MappingSpec.yaml` on repossa ja käytetään Sprint 2:ssa.
- Dokumentaatio pidetään ajan tasalla jokaisen sprintin lopussa.

## SaaS baseline (MVP)
- Env separation: dev/staging/prod konffattavissa env-var:eilla.
- Asset storage on ulkoinen object storage (ei paikallinen levy tuotannossa).
- Perusobservability hook (Sentry/structured logs) on valmiina.

## vNext (informatiivinen)
- Kytkentäkuvaeditori on sama kuin tuloste (page model).
- Työkirja-tab mahdollistaa copy/paste bulk-editin.
- Johdetut listat (laite/kaapeli/kilpi) muodostuvat kytkentäkuvista.
