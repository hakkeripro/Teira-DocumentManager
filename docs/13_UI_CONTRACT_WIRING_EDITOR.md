# UI Contract v1 — Wiring Diagrams Editor (WIRING_DIAGRAMS)

Tämä dokumentti lukitsee WIRING_DIAGRAMS-editorin UI-rakenteen ja print-layoutin.
Kaikki tulevat sprintit ja muutokset on toteutettava tämän mukaan.
Poikkeamat vaativat käyttäjän erillisen hyväksynnän.

## Referenssit (source of truth)
Kuvat löytyvät: docs/ui_refs/wiring_editor_v2/
- Kytkentäkuva_Kansi.png
- Kytkentäkuva_DI16.png
- Kytkentäkuva_AS-P.png
- Kytkentäkuva_DO-FA.png
- Työkirja.png

## Reititys ja näkymärakenne
- WIRING_DIAGRAMS avautuu suoraan editoriin (ei canonical-välinäkymää).
- Editorissa on kaksi tabia:
  1) Kytkentäkuva (print-grid-edit, A4 portrait)
  2) Työkirja (excelimäinen bulk-edit)

## Layout
- Vasen: Pages-puu (sivut järjestyksessä, drag/drop reorder)
- Oikea: A4 portrait -sivu (print-grid), jonka mittasuhde ja sarakejako vastaa referenssikuvia.

## Sivunumerointi ja lukitus
- Jos automation_server_type = AS-P:
  - 01 = PS (LOCKED)
  - 02 = AS-P (LOCKED)
  - moduulisivut alkavat 03 →
- Moduulin lisäys UI:sta:
  - uusi moduulisivu saa aina seuraavan vapaan koodin maxin jälkeen (ei täytetä aukkoja alusta).
- Reorder ei muuta page_codea.

## Print-grid sarakerakenne
Taulukon sarakkeet ja ryhmittely vastaa referenssiä:
- Tunnus / Teksti (kenttälaiteblokki)
- Liitin (monirivinen; template tuottaa "connector lines")
- Kaapeli 1: Tyyppi/koko/nro, Välikytkentäpaikka/rimmet, Pari nro/johdin
- Kaapeli 2: Tyyppi/koko/nro, Pari nro/johdin
- Minne johdetaan: Liitin, Kytkentäpaikka

## Liitin-mallinnus (templates)
Template määrittää per IO-rivi "connector lines" -listan (stacked labels),
esim. DO: [DO1 NO/1, DO1 C/2, G, G0], DI: [DI1/1, RET/2, G, G0], AS-P: [Ethernet1 RJ-45, ...].

## Työkirja
- Työkirja vastaa vanhan työkalun workbook-sarakkeita (ks. Työkirja.png).
- Multi-cell paste TSV:llä (tab/newline).
- Tallennus päivittää canonical rows; editorin johdetut näkymät käyttävät canonicalia.

## Kansi ja revisio
Kansi + muutoshistoria ovat osa publish/PDF-putkea (ei pakollinen editorin muokkausvaiheessa).
