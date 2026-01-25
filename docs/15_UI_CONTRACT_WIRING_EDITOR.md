# UI Contract v1 — WIRING_DIAGRAMS Editor ("editor == tuloste")

Tämä dokumentti **lukitsee** WIRING_DIAGRAMS-editorin UI-rakenteen ja print-layoutin.

Kaikki tulevat sprintit ja muutokset **on toteutettava tämän mukaan**.
Poikkeamat vaativat käyttäjän erillisen hyväksynnän, koska muuten PDF-publish ei voi olla
"editor == tuloste".

## Referenssit (source of truth)

Kuvat löytyvät repo:sta ja toimivat editorin sekä PDF-renderöinnin visuaalisena totuutena:

- `docs/ui_refs/wiring_editor_v2/Kytkentakuva_Kansi.png`
- `docs/ui_refs/wiring_editor_v2/Kytkentakuva_DI16.png`
- `docs/ui_refs/wiring_editor_v2/Kytkentakuva_AS-P.png`
- `docs/ui_refs/wiring_editor_v2/Kytkentakuva_DO-FA.png`
- `docs/ui_refs/wiring_editor_v2/Tyokirja.png`

## Reititys ja näkymärakenne

- WIRING_DIAGRAMS avautuu **aina suoraan editoriin** (ei canonical-välinäkymää).
- Editorissa on **kaksi tabia**:
  1) **Kytkentäkuva** (print-grid-edit, A4 portrait)
  2) **Tyokirja** (Excel-tyyppinen bulk-edit)

## Layout

- Vasen: **Pages-puu** (sivut järjestyksessä, drag/drop reorder)
- Oikea: **A4 portrait** -sivu (print-grid), jonka mittasuhde ja sarakejako vastaa referenssikuvia.

## Sivunumerointi ja lukitus

Jos `automation_server_type` / editor-state `automationServerType` = `AS-P`:

- `01 = PS` (**LOCKED**)
- `02 = AS-P` (**LOCKED**)
- IO-moduulit alkavat `03 →`

Lisäksi:

- Moduulin lisäys UI:sta antaa `page_code`:n **append-periaatteella**: aina seuraava vapaa numero
  nykyisen maksimin jälkeen (ei täytetä aukkoja alusta).
- Reorder ei muuta `page_code`a eikä moduulin identiteettiä.

## Print-grid (A4) — sarakerakenne

Taulukko ja otsikointi mallinnetaan referenssien mukaan (ryhmäotsikot + alisarakkeet).
Minimitasolla näkyvät sarakkeet:

- **Tunnus / Teksti** (kenttälaiteblokki)
- **Liitin** (templaten "connector lines" / stacked labels)
- **Kaapeli 1**
  - Tyyppi/koko/nro
  - Välikytkentäpaikka / rimmet
  - Pari nro / johdin
- **Kaapeli 2**
  - Tyyppi/koko/nro
  - Pari nro / johdin
- **Minne johdetaan**
  - Liitin
  - Kytkentäpaikka

## Liitin-mallinnus ("connector lines")

Referenssit näyttävät, että **yksi print-rivi** sisältää useita liitinrivejä samassa solussa
("stacked labels"). Esimerkkejä:

- DO-kanava: `DO1 NO/1`, `DO1 C/2`, `G`, `G0`
- DI-kanava: `DI1/1`, `RET/2`, `G`, `G0`
- AS-P: Ethernet/RS-485/LON -rivit referenssin mukaisesti

Template-mallin on tuettava tätä (ks. `docs/12_MODULE_TEMPLATE_LIBRARY.md`).

## Tyokirja

- Tyokirja vastaa vanhan työkalun workbook-sarakkeita (ks. `Tyokirja.png`).
- Multi-cell paste TSV:llä (tab/newline) on tuettava.
- Tallennus päivittää canonical rows -dataa; editorin johdetut näkymät käyttävät canonicalia lähteenä.

## Kansi ja revisio

Kansi + muutoshistoria ovat osa publish/PDF-putkea.
Editorissa niitä ei tarvitse muokata Sprint 5:ssä, mutta publishissa niiden rakenne renderöidään.
