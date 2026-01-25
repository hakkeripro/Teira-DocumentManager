# Sprint Plan (high-level) v1.3

- Sprint 1: Runko + auth + area/project + documents + revisions (publish + PDF + SaaS baseline)
- Sprint 2: **Keskukset (SubCenter) + dokumenttien migraatio keskuksille** + Mapping engine + XML/XLSX import/export + import audit UI (+ valmius job-queueen)
- Sprint 3: Kytkentäkuvaeditori + symbolit + XML export UI
- Sprint 4: **Wiring Editor v2** (Page Model + Template Library + Työkirja-tab + AS-P default pages)
- Sprint 5: **Derived lists v1** (Laiteluettelo/Kaapeliluettelo/Kilpiluettelo) + Symbolit v2 + PDF publish parity + publish async -valmius

## Backlog note: Invite/join existing company
Sprint 1 creates a new company (tenant) for the first user. A future sprint should add:
- Admin creates an invite (token/link) for an existing company
- New user accepts invite to join the same `company_id` (role set to DESIGNER/VIEWER/ADMIN)

## Backlog note: Center-aware data beyond documents
V1.2 tekee dokumenteista keskuskohtaisia. Tulevissa sprinteissä voidaan tarvittaessa tarkentaa myös muuta dataa (esim. kaapelit/pointit/symbolit) keskuksille, jos asiakkaan formaatit ja käytännön käyttö sitä vaativat.

---

## Re-baseline: seuraavat sprintit (tavoitetila kuvien ja referenssien perusteella)

### Sprint 4 (re-baseline): Wiring Editor v2 (Page Model) + Template Library + Työkirja-tab
- Ota käyttöön “page model” (wiring_pages + template_terminals + terminal bindings)
- Lisää template library: DI-16, UI-16, AO-V-8, DO-FA-12(-H), PS, AS-P (minimissä)
- Kytkentäkuvaeditori: sisäinen puu (sivut), drag/drop järjestys, lukitut sivut automaatiopalvelin-tyypin mukaan
- Lisää Työkirja-tab (bulk copy/paste IO-pointteihin)

### Sprint 5: Derived lists v1 + Symbolit v2 + PDF publish parity + publish async
- Johdetut listat (v1):
  - laiteluettelo (2-sarakkeinen, muokattava; default: tunnus + kuvaus)
  - kaapeliluettelo (kaapeli 1/2, päät, tyyppi/koko jos syötetty)
  - kilpiluettelo (2-sarakkeinen muokattava lista toimitettaville; default: tunnus + kuvaus)
- Symbolit v2: kontaktit/laajennus (ei oletuksia ilman käyttäjän referenssiä)
- PDF publish viimeistely: renderöi page model -pohjaisesti niin, että editor == tuloste
- Publish async -valmius: abstraction/extension point worker/job queue -mallille (Managed SaaS)
### Sprint 6: Laitekirjasto + BOM + Layout-editori (perusta)
- Device catalog + optionaaliset BOM-rivit (esim. anturitasku)
- Device instances ja monen IO:n linkitys (esim. VFD roolit)
- Layout-editorin perusta (kaappirunko + drag/drop moduulit) ja linkitys kytkentäkuvien sivuihin
- Luetteloiden rikastus device catalogin avulla (supplied_by_us, oheistuotteet)
### Sprint 7: Layout-editori (graafinen)
- Kaappirungon valinta (esim. SXWOS-2) + komponenttien raahaus
- Linkitys kytkentäkuvien moduulisivuihin ja määrälaskenta
- Layout export (myöhemmin)

### Sprint 8: Väyläkaaviot + automaatiopalvelin-tyyppien laajennus
- BUS_DIAGRAMS docType + editor
- AS-B ja muut palvelin-variantit (oletussivut, templaatit)

