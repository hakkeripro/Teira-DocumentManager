# MVP Scope (Teira DocumentManager) v1.3

## MVP sisään
- Auth (tunnukset), roolit: `ADMIN`, `DESIGNER`, `VIEWER`
- Alueet (Area) → Projektit (Project)
- Documents-näkymä (listaus + viimeisin rev -sarake)
- Dokumenttikohtainen revisiohistoria + Publish (PDF)
- Kytkentäkuvat: moduulit + kanavat + symbolit liittimen vieressä
- Import/export (Sprint 2, MappingSpec.yaml authoritative)
- Production SaaS baseline: env separation (dev/staging/prod), object storage assets, observability hook

## MVP ulos (Phase 2+)
- Alakeskuslayout editor (vain kirjasto/valinta myöhemmin)
- Väyläkaaviot

---

## Tavoitetilan lisäykset (post-MVP / vNext)
Seuraavat ovat tuotteen tavoitetilaa ja ohjaavat tulevia sprinttejä:
- Kytkentäkuvakirja (editor == tuloste): moduulisivut + liitintiedot (template library) + kaapelointi + symbolit + laitteet
- Työkirja-tab kytkentäkuvissa (copy/paste bulk-edit)
- Johdetut luettelot kytkentäkuvista: laite-, kaapeli- ja kilpiluettelot
- Layout-editori (graafinen kaappisuunnittelu)
- Väyläkaaviot (BUS_DIAGRAMS)
- Automaatiopalvelin-tyypit (AS-P, AS-B, …) ja niiden oletussivut + lukitukset


