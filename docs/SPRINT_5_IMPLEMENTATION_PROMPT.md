# SPRINT 5 IMPLEMENTATION PROMPT (Editor parity: Derived lists v1 + PDF publish + Symbolit v2)

## ROLE
Toimi Senior Fullstack/Architect -roolissa. Älä arvaa. Käytä vain käyttäjän toimittamaa ZIP-pakettia lähteenä.

## INPUTS (USER PROVIDES)
Project ZIP (single zip): koko repo (Sprint 4 final state + kaikki patchit) sisältäen `docs/` viimeisimmän tilan.

Tämä ZIP on source of truth (docs sisällä).

ÄLÄ AVAA `.env`-TIEDOSTOA missään tilanteessa.

## CRITICAL RULES
- Docs = source of truth. Jos koodi ja docs ovat ristiriidassa, päivitä koodi vastaamaan docsia.
- Dokumentaatio pidetään ajan tasalla koko sprintin ajan (päivitä docs samalla kun muutat toteutusta).
- Managed SaaS: älä lukitse arkkitehtuuria pois tulevalta job-queue/worker-mallilta.
- Tenant-scope: kaikki data aina `company_id` scopessa ja center-scope `sub_center_id` missä relevanttia.
- Sprintin toimitus patch-tyyppinen: lopussa tuotetaan ZIP, jossa vain uudet/muuttuneet tiedostot (puretaan repojuureen).
- Kun sprintti on todettu toimivaksi (lint/typecheck/build + smoke test), tuota seuraavan sprintin prompti sprintin lopussa.

## UI CONTRACT (NON-NEGOTIABLE)
WIRING_DIAGRAMS-editorin UI ja print-layout on lukittu dokumentissa:

- `docs/15_UI_CONTRACT_WIRING_EDITOR.md`
- Referenssikuvat: `docs/ui_refs/wiring_editor_v2/*`

Älä toteuta WIRING_DIAGRAMS-näkymiä, PDF-renderöintiä tai template-mallia tavalla, joka poikkeaa referenssien rakenteesta ilman käyttäjän hyväksyntää.

## SCOPE — SPRINT 5

### 1) Derived lists v1 (Laiteluettelo, Kaapeliluettelo, Kilpiluettelo)
Toteuta center-scopatut johdetut listat, jotka perustuvat ensisijaisesti kytkentäkuvan (WIRING_DIAGRAMS v2) dataan.

Minimivaatimukset:
- **Laiteluettelo v1:** 2-sarakkeinen muokattava lista (default: tunnus + kuvaus)
- **Kaapeliluettelo v1:** kaapelitunnus/tyyppi/koko (jos syötetty) + päät koottuna kytkentäkuvasta
- **Kilpiluettelo v1:** 2-sarakkeinen muokattava lista toimitettaville laitteille (default: tunnus + kuvaus)

Tärkeää:
- “Derived + editable”: järjestelmä ehdottaa rivit deterministisesti, käyttäjä voi muokata.
- Älä oleta device catalog / BOM -malleja ilman käyttäjän referenssiä (OI-006, OI-008).

### 2) Symbolit v2 (kontaktit / laajennus)
Laajenna symbolimallia kohti "kontaktit" -tukea, mutta:
- **Älä tee oletuksia** symbolityypeistä, jos käyttäjän referenssi puuttuu (OI-005).
- Tee rakenteellinen extension point: uusia symbolityyppejä ja renderöintilogiiikkaa voidaan lisätä myöhemmin ilman refactor-kaaosta.

Minimi:
- symbolit näkyvät edelleen ikonina + tekstinä, mutta tietomalli sallii kontaktiryhmät / multi-terminal -sidonnat tulevaisuudessa.

### 3) PDF publish parity (editor == tuloste)
Viimeistele PDF-publish niin, että se renderöi page model -pohjaisesti ja on visuaalisesti yhdenmukainen editorin print-gridin kanssa.

Minimivaatimukset:
- PDF käyttää page model -järjestystä ja AS-P/PS lukitusta (01/02).
- Sarakkeet ja otsikointi noudattavat UI Contract -referenssejä.
- Kansi ja muutoshistoria voidaan toteuttaa perusmuodossa (jos jo olemassa), mutta älä riko nykyistä.

### 4) Publish async -valmius (worker/job queue extension point)
Lisää selkeä extension point:
- publish voidaan tulevaisuudessa ajaa taustajobina (queue/worker).
- toteuta rajapinta/abstraktio siten, että synchronous toteutus voidaan vaihtaa myöhemmin ilman laajoja muutoksia.

Älä lisää monimutkaista infraa tässä sprintissä, mutta varaa arkkitehtuurinen paikka.

### 5) Docs
Päivitä `docs/` koko sprintin ajan.

Sprintin lopussa:
- päivitä derived lists v1 speksi (`docs/13_DERIVED_LISTS_AND_NAMEPLATES.md` jos tarpeen)
- päivitä PDF publish -polku ja renderöinti (viittaukset UI Contractiin)
- päivitä `docs/OPEN_ITEMS.md` (mitä tarkentui, mitä jäi auki; lisää target sprint)

## DEFINITION OF DONE (SPRINT 5)
- Derived lists v1 käytössä (laiteluettelo/kaapeliluettelo/kilpiluettelo) ja tenant/center scope pitää.
- Symbolit v2: extension point olemassa, ei riko nykyistä editoria.
- PDF publish renderöi page model -pohjaisesti ja noudattaa UI Contractia.
- Publish async -valmius: selkeä extension point / rajapinta.
- `npm run lint`, `npm run typecheck`, `npm run build` vihreä.
- Dokumentaatio päivitetty (docs ajan tasalla).
- Toimitettu Sprint 5 patch ZIP (vain muuttuneet/uudet tiedostot, puretaan repojuureen).
- Sprintin lopussa tuotetaan:
  - lyhyt yhteenveto muutoksista
  - SPRINT 6 IMPLEMENTATION PROMPT

## TEST COMMANDS
npm install
npm run prisma:generate
npm run prisma:migrate
npm run lint
npm run typecheck
npm run build
npm run dev
