# UI Contract v1 — Wiring Diagrams Editor (WIRING_DIAGRAMS) — LUKITTU

Tämä dokumentti lukitsee WIRING_DIAGRAMS-editorin UI-rakenteen ja print-layoutin.
Kaikki muutokset on toteutettava tämän mukaan.
Poikkeamat vaativat käyttäjän erillisen hyväksynnän.

## Referenssit (source of truth)

1) Kuvat: `docs/ui_refs/wiring_editor_v2/`
- `Kytkentakuva_Kansi.png`
- `Kytkentakuva_DI16.png`
- `Kytkentakuva_AS-P.png`
- `Kytkentakuva_DO-FA.png`
- `Tyokirja.png`

2) PDF (publish-pariteetti):
- `docs/golden/kytkentäkuva.pdf` (+ `docs/golden/rendered/*`)

Vaatimus:
- Sarakkeet, otsikot, järjestys: **1:1**
- Visuaali: **95%**

## Näkymärakenne
- WIRING_DIAGRAMS avautuu suoraan editoriin.
- Editorissa on kaksi tabia:
  1) **Kytkentäkuva** (print-grid-edit, A4 portrait)
  2) **Työkirja** (excelimäinen bulk-edit; sarakkeet/otsikot 1:1 referenssiin)

## Layout

**FINAL-S2 (2026-01-25):** Layout-rakenne lukittu:

- **Vasen**: Pages-paneeli (kortti)
  - Pages-lista järjestyksessä, drag/drop reorder
  - **"Add module"** -kontrolli on **vasemman kortin yläosassa** (header), ei puun sisällä eikä alaosassa

- **Oikea**: A4 portrait -sivu (print-grid / canvas)
  - A4-sivun mittasuhde ja sarakejako vastaa referenssejä
  - **A4-kytkentäkuva renderöidään aina Pages-paneelin oikealle puolelle — ei koskaan Pages-paneelin alapuolelle.** (LOCKED)

### Document Workspace Shell (Sprint 1)
- WIRING-editori käyttää kolmen paneelin workspace-shelliä:
  - **Vasen**: Pages/Modules/Devices -välilehdet (flat list, ei foldereita).
  - **Keskellä**: A4 print-grid + zoom controls (Fit width oletus).
  - **Oikea**: Inspector + Issues-paneeli (MVP).
- Top bar (WIRING):
  - breadcrumbs + doc context + revision placeholder + save-status
  - **Import XML / Export XML / Audit** -toiminnot näkyvissä (ei erillistä import/export-sivua)
  - Issues-badge “Issues: N” (dok-scope)

**FINAL-S1 (2026-01-25):** Folder expand/collapse -toiminto on tarkoitettu **vain päänavigaatioon** (Areas/Projects main tree).
- Wiring editorin Pages-listassa **ei käytetä** kansioita eikä collapse/expand -UI:ta ellei erikseen määritetä.
- Pages-lista on yksinkertainen, “flat list” -tyyppinen.

### Layout acceptance (DoD / parity gate)
- Viewportissa Pages-paneeli pysyy vasemmalla ja A4-canvas pysyy oikealla; UI ei “stackaudu” siten, että A4 siirtyisi Pages-paneelin alle.
- Jos leveys ei riitä kahteen paneeliin, ratkaisu on **horisontaalinen scroll / overflow** (tai muu sivusuuntainen ratkaisu), ei vertikaalinen pinoutuminen.
- “Add module” näkyy ilman scrollausta Pages-paneelin yläosassa (header).

## Sivunumerointi ja lukitus
- AS-P-keskuksessa oletussivut:
  - 01 = PS (**LOCKED**)
  - 02 = AS-P (**LOCKED**)
- Käyttäjä voi lisätä PS-sivuja myöhemmin vapaasti mihin väliin tahansa (vain oletus-PS on lukittu).
- Moduulin lisäys UI:sta:
  - uusi moduulisivu saa aina seuraavan vapaan koodin maxin jälkeen (ei täytetä aukkoja alusta).
- **Reorder päivittää page_code** (address sync): sivukoodit päivittyvät uuden järjestyksen mukaisiksi.
- Sisäiset, pysyvät ID:t eivät muutu reordertessa; vain osoite-/koodikenttä synkataan uuteen järjestykseen.

## Print-grid sarakerakenne (rakenteeltaan 1:1)
Taulukon sarakkeet ja ryhmittely vastaa referenssiä:
- Tunnus / Teksti (kenttälaiteblokki)
- Liitin (monirivinen; template tuottaa "connector lines")
- Kaapelointitiedot:
  - Kaapeli 1 (Pari nro, Tyyppi koko nro)
  - Välikytkentäpaikka ja liittimet
- Kaapeli 2:
  - Tyyppi koko nro
  - Pari nro tai johdin
- Minne johdetaan:
  - Liitin
  - Kytkentäpaikka
- Kytketty (checkbox)
- Tarkastettu (checkbox)

### Print-grid visuaali (pariteetti)
- Print-grid (A4-canvas) on **valkoinen** tausta, ohuet viivat, musta teksti referenssin mukaisesti.
- A4-alueella ei käytetä “dark theme + rounded input boxes” -tyylistä ulkoasua, jos se rikkoo 95% pariteetin.

## Liitin (stacked labels) — connector lines

Yksi print-“terminaaliblokki” vastaa yhtä IO-kanavaa (terminal_code), mutta **Liitin**-solu voi sisältää useita rivejä.
Nämä rivit tulevat moduulitemplatesta `connector_lines[]`.

Tärkeää:
- Data (kaapelit, destination, laitevalinta) bindataan **terminal_codeen**, ei yksittäiseen connector_lineen.
- Connector_lines on tulosteen pariteettia varten.

### Rivikohtaisuus (rowSpan-sääntö, pariteetin kannalta lukittu)
Kun terminal_code:lla on useita connector_lines:
- Vain seuraavat sarakkeet ovat connector-line -rivikohtaisia (renderöidään useana rivinä):
  - Liitin
  - Kaapeli 1: Pari nro / johdin
  - Välikytkentäpaikka ja liittimet
  - Kaapeli 2: Pari nro / johdin
  - Minne johdetaan: Liitin
- Kaikki muut sarakkeet ovat terminaalikohtaisia ja niiden tulee “jatkua” connector-line -rivien yli (rowSpan):
  - Tunnus, Teksti
  - Kaapeli 1: Tyyppi koko nro
  - Kaapeli 2: Tyyppi koko nro
  - Minne johdetaan: Kytkentäpaikka
  - Symboli/Piirrosmerkintä
  - Kytketty, Tarkastettu

## Työkirja
- Sarakkeet, otsikot ja järjestys: 1:1 referenssiin (`Tyokirja.png`).
- Copy/paste (TSV) on ensisijainen bulk-edit.
- Kytkentäkuva ja työkirja ovat **synkronissa molempiin suuntiin**: kummasta tahansa muokataan, muutokset näkyvät toisessa.

## Import / Export (UX)
- Ei erillistä Import/Export-sivua kytkentäkuville.
- Import ja Export -toiminnot ovat käytettävissä sekä **Kytkentäkuva**-tabissa että **Työkirja**-tabissa.
- Vain WIRING_DIAGRAMS tarvitsee XML exportin (muissa dokumenteissa export = copy/paste taulukosta).

## Kansi ja revisiot
- Publish-putki tuottaa kansisivun + revisiotaulukon minimitasolla.
- Publish-PDF:n tulee vastata editorin print-grid -näkymää (editor == tuloste).
