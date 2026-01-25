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
- Vasen: Pages-puu
  - Sivut järjestyksessä, drag/drop reorder
  - “Kansiomaiset” ryhmät ovat **vain UI-ryhmittelyä** (ei tallennu DB:hen).
  - Kansion edessä kansio-ikoni; ryhmät avattavissa/suljettavissa.
- Oikea: A4 portrait -sivu (print-grid), jonka mittasuhde ja sarakejako vastaa referenssejä.

## Sivunumerointi ja lukitus
- AS-P-keskuksessa oletussivut:
  - 01 = PS (**LOCKED**)
  - 02 = AS-P (**LOCKED**)
- Käyttäjä voi lisätä PS-sivuja myöhemmin vapaasti mihin väliin tahansa (vain oletus-PS on lukittu).
- Moduulin lisäys UI:sta:
  - uusi moduulisivu saa aina seuraavan vapaan koodin maxin jälkeen (ei täytetä aukkoja alusta).
- Reorder ei muuta page_codea.

## Print-grid sarakerakenne (rakenteeltaan 1:1)
Taulukon sarakkeet ja ryhmittely vastaa referenssiä:
- Tunnus / Teksti (kenttälaiteblokki)
- Liitin (monirivinen; template tuottaa "connector lines")
- Kaapeli 1: Tyyppi/koko/nro, Välikytkentäpaikka/rimmet, Pari nro/johdin
- Kaapeli 2: Tyyppi/koko/nro, Pari nro/johdin
- Minne johdetaan: Liitin, Kytkentäpaikka

## Liitin (stacked labels) — connector lines

Yksi print-rivi vastaa yhtä IO-kanavaa (terminal_code), mutta **Liitin**-solu voi sisältää useita rivejä.
Nämä rivit tulevat moduulitemplatesta `connector_lines[]`.

Tärkeää:
- Data (kaapelit, destination, laitevalinta) bindataan **terminal_codeen**, ei yksittäiseen connector_lineen.
- Connector_linet ovat tulosteen pariteettia varten.

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
