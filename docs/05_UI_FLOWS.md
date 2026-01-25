# UI Flows v1.3 – nykytila + North Star

## Navigaatio
Vasen puu: **Alueet → Projektit → Keskukset**

- Projectin alla listataan keskukset (SubCenter/Center).
- Keskus on “konteksti”, jonka sisällä dokumentit ovat yksiselitteisiä.

### Reitit (pääpolut)
- Areas list: `/app/areas`
- Area detail: `/app/areas/:areaId`
- Project entry: `/app/projects/:projectId` (redirect ensimmäiseen keskukseen)
- Centers list: `/app/projects/:projectId/centers`
- Center documents: `/app/projects/:projectId/centers/:subCenterId/documents`
- Import/Export: `/app/projects/:projectId/centers/:subCenterId/import`
- Import runs: `/app/projects/:projectId/centers/:subCenterId/imports`

## Projektin sisällä (center scoped)
- **Centers** (listaus + create + select)
- **Documents** (keskuskohtainen listaus + viimeisin rev + Publish + History)
- **Import/Export** (upload, dry-run, commit, export download, audit)
- **Library** (ADMIN: moduulit, point-tyypit, symbolit) — tulevissa sprinteissä

## Dokumentit (MVP)
- Documents-sivulla listataan dokumenttityypit ja niiden tila:
  - canonical row count (importista)
  - viimeisin revisio (jos julkaistu)
- DocType-sivulla:
  - canonical preview (ensimmäiset rivit)
  - revisiohistoria
  - publish (luo revision + PDF assetin)

## Kytkentäkuvat (tulevat sprintit)
Sprint 3+ lisää:
- kytkentäkuvaeditorin moduuli/kanava UI
- symbolit / editor-perusteet
- wiring diagram -näkymä muuttuu “editor + publish” -malliksi

## Onboarding (Sprint 1)
Onboarding on toteutettu root reittinä: `/onboarding`
- Syy: `/app` layout vaatii `app_user` (actor), joten `/app/onboarding` voi muuten loopata.

---

## North Star: Kytkentäkuvaeditori (editor == tuloste)

**UI Contract (lukittu):** `docs/15_UI_CONTRACT_WIRING_EDITOR.md`

Kaikki WIRING_DIAGRAMS-editorin UI-muutokset ja PDF-renderöinti tehdään tämän sopimuksen mukaan.

### Navigaatio (vasen puu)
Vasen puu: **Alueet → Projektit → Keskukset**.

- “MAIN/Default”-keskusta ei näytetä erillisenä konseptina.
- Kun ensimmäinen keskus luodaan, sille luodaan automaattisesti dokumenttirunko.  
- Keskuksella on `automation_server_type`, joka määrittää oletussivut (esim. AS-P → 01 PS ja 02 AS-P, järjestys lukittu).

### Kytkentäkuvat (WIRING_DIAGRAMS)
Kytkentäkuvat avautuvat suoraan editoriin, jossa on:
- vasemmalla **editorin sisäinen puu** (IO Bus / sivut)
- oikealla **sivunäkymä**, joka vastaa tulostetta (taulukko)
- ylhäällä työkalupalkki:
  - Import (WIRING_DIAGRAMS)
  - Export XML (ObjectSet)
  - Publish PDF
  - (myöhemmin) Export workbook / import workbook

**Sivujen järjestys**
- Drag & drop järjestys puussa.
- Lukitut sivut (01 PS ja 02 AS-P AS-P-keskuksessa) eivät ole siirrettävissä.

**Muokkaus**
- Taulukko on ensisijainen editori (editor == tuloste).
- Lisäksi editorissa on välilehti: **Työkirja**, jossa on samat rivit/sarakkeet kuin järjestelmän taulukossa, jotta copy/paste onnistuu “excelimäisesti”.

### Työkirja (tab)
Työkirja on kytkentäkuvaeditorin oma tabi, jonka tarkoitus on:
- mahdollistaa bulk-syöttö (copy/paste)
- näyttää “pisteet”/IO-rivit tiiviissä muodossa (Type/Name/Description/Module ID/Channel/…)
- synkata muokkaukset takaisin kytkentäkuvakirjan dataan deterministisesti.

### Symbolit ja laitteet
- **Symbolit** kiinnittyvät **terminaaleihin** (esim. rele, jumppi). Alkuun ikoni + teksti riittää.
- **Laitteet/kytkentäpaikat** ovat kenttälaitteita (tag + kuvaus), jotka voivat käyttää yhtä tai useampaa terminaalia.
  - Anturi: tyypillisesti yksi terminaali
  - Taajuusmuuttaja: optionaaliset IO-roolit (hälytys, indikointi, ohjaus, säätöviesti)

### Kaapelointi (Kaapeli 1 / Kaapeli 2)
- Jos kenttälaite on kytketty **suoraan moduulille** (oletus, pois lukien kaapin sisäiset), kaapelitunnus tulee **Kaapeli 1** -kenttään.
- Jos käytetään riviliittimiä / välikytkentää tai tarvitaan toinen segmentti, kenttäkaapeli merkitään **Kaapeli 2** -kenttään.
- Pari/johdin tekstit ovat vapaasti muokattavia (“2 pu / 2 si” oletus JAMAK; NOMAK “2 or / 2 va”).

### Testauslista (TEST_LIST)
Testauslistalla on oma import (XLSX/XML) + editori.
Muille dokumenteille import ei ole välttämätön, koska ne johdetaan kytkentäkuvista.

### Johdetut luettelot
- Laiteluettelo, kaapeliluettelo ja kilpiluettelo muodostetaan kytkentäkuvasta + kirjastoista.
- Käyttäjä voi täydentää/korjata tietoja, mutta lähde on kytkentäkirja.

### Layout (CENTER_LAYOUT)
Layout on erillinen näkymä:
- käyttäjä valitsee kaappirungon (esim. `SXWOS-2`)
- raahaa moduulit ja oheislaitteet paikoilleen
- layout tuottaa määrälaskentaa ja linkittyy kytkentäkuvien moduuleihin.

