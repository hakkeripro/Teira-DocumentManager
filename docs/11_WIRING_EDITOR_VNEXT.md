# 11 – WIRING_DIAGRAMS Editor vNext (editor == tuloste) v1.3

Tämä dokumentti kuvaa kytkentäkuvien tavoitetilan, joka vastaa toimitettuja referenssikuvia.

## Ydinajatus
- Kytkentakuvat ovat **kytkentäkuvakirja**: joukko **moduulisivuja**, joilla jokaisella on **liitintiedot (terminaalit)**.
- Editorin näkymä on sama, joka myöhemmin renderöidään PDF:ksi (**editor == tuloste**).
- Import ja työkirja täydentävät dataa, mutta eivät muuta sivupohjan logiikkaa.

## UI reference images

Nämä kuvat ovat UI- ja tulostereferenssi (A4, portrait) ja niitä käytetään aina editorin toteutuksen pohjana:

- `docs/ui_refs/wiring_editor_v2/Kytkentakuva_Kansi.png`
- `docs/ui_refs/wiring_editor_v2/Kytkentakuva_DI16.png`
- `docs/ui_refs/wiring_editor_v2/Kytkentakuva_AS-P.png`
- `docs/ui_refs/wiring_editor_v2/Kytkentakuva_DO-FA.png`
- `docs/ui_refs/wiring_editor_v2/Tyokirja.png`

UI-vaatimus: WIRING_DIAGRAMS avautuu suoraan editoriin (ei erillistä canonical-näkymää); editorissa on samassa näkymässä **Kytkentakuva** + **Tyokirja** -tabit.

### UI Contract (lukittu)

WIRING_DIAGRAMS-editorin UI ja print-grid on lukittu dokumentissa:
- `docs/15_UI_CONTRACT_WIRING_EDITOR.md`

Kaikki jatkokehitys (UI, PDF-renderöinti, templaatit) on tehtävä tämän sopimuksen mukaisesti.

## Sivu (wiring page)
Sivu on instanssi valitusta moduulipohjasta (template).
- `page_code`: esim. `02`, `03`, `14`
- `page_name`: esim. `PS`, `AS-P`, `DO-FA-12-H`
- `template`: määrää terminaalirivit ja järjestyksen
- `order_index`: järjestys kirjassa
- `is_order_locked`: estää siirron puussa (esim. AS-P-keskuksessa 01 PS ja 02 AS-P)

## Terminaali (terminal)
Terminaali on rivin ankkuri, johon kiinnitetään:
- symboli (terminaliin)
- kaapelointi (Kaapeli 1 / Kaapeli 2)
- laite-/kytkentäpaikka (kenttälaite voi käyttää useampaa terminaalia)

`print_label` tulee templatesta ja vastaa tulostetta (esim. `DO8 NO / 15`).

## Symbolit
- Symboli kiinnitetään terminaaliin.
- Alkuun symboli voidaan esittää ikonina + tekstinä (esim. rele, jumppi).
- Kontaktien ja laajemman piirto-logiikan tuki lisätään myöhemmin.

## Laitteet / kytkentäpaikat
- Laite voi olla “yksi terminaali” (anturi) tai “moni-IO” (taajuusmuuttaja: hälytys/indikointi/ohjaus/säätöviesti).
- Laitteella voi olla BOM (oheistuotteet), ja kaikki laitteet eivät ole teidän toimituksessa.

## Kaapelointi (Kaapeli 1 / Kaapeli 2)
- Suora kenttälaite→moduuli (oletus): Kaapeli 1 täytetään.
- Jos käytetään riviliittimiä/välikytkentää tai toista segmenttiä: Kaapeli 2 täytetään kenttäkaapelille tai toiselle segmentille.
- Pari/johdin teksti on vapaasti muokattava (JAMAK: “2 pu / 2 si”; NOMAK: “2 or / 2 va”).

## Editorin sisäinen puu
- Näyttää sivut järjestyksessä.
- Drag/drop järjestys, mutta lukitut sivut eivät siirry.
- “Edit all sequentially” -tila mahdollistaa sivujen muokkauksen peräkkäin.

## Tyokirja-tab (copy/paste)
Kytkentäkuvissa on oma “Tyokirja”-tab, jossa:
- IO-pisteet näkyvät taulukossa (Type/Name/Description/Module ID/Channel/…)
- käyttäjä voi copy/paste-muokata rivejä kuten Excelissä
- muutokset synkataan kytkentäkuvakirjan dataan deterministisesti


## UI references (source of truth)

Tämän sprintin jälkeen UI-suunnan **source of truth** ovat seuraavat referenssikuvat (docs-paketissa):

- `docs/ui_refs/wiring_editor_v2/Kytkentakuva_Kansi.png`
- `docs/ui_refs/wiring_editor_v2/Kytkentakuva_AS-P.png`
- `docs/ui_refs/wiring_editor_v2/Kytkentakuva_DI16.png`
- `docs/ui_refs/wiring_editor_v2/Kytkentakuva_DO-FA.png`
- `docs/ui_refs/wiring_editor_v2/Tyokirja.png`

UI:n toteutus **ei saa poiketa** referenssien rakenteesta ilman käyttäjän hyväksyntää (muuten PDF-publish ei voi olla 'editor == tuloste').

Päätetyt säännöt:
- WIRING_DIAGRAMS avautuu **aina suoraan editoriin** (ei erillistä canonical-näkymää).
- Sivukoodi tulostuksessa: `NN_TEMPLATEID` (esim. `03_DI-16`, `14_DO-FA-12-H`).
- AS-P-keskuksessa oletussivut: `01 (PS)` ja `02 (AS-P)`; järjestys lukittu.
- Uudet sivut/moduulit saavat koodin **append-periaatteella**: aina seuraava vapaa numero nykyisen maksimin jälkeen (ei täytetä 'aukkoja' alusta).

---

# Sprint 4 implementation details

## Page model data storage

The editor v2 state is stored inside the **document settings**:

`document.settings_jsonb.editor.WIRING_DIAGRAMS_V2`

### Shape

```json
{
  "version": 1,
  "updatedAt": "2026-01-23T12:00:00.000Z",
  "automationServerType": "AS-P",
  "pages": [
    { "id": "page:PS", "code": "01", "title": "PS", "templateId": "PS", "locked": true },
    { "id": "page:AS-P", "code": "02", "title": "AS-P", "templateId": "AS-P", "locked": true },
    { "id": "mod:di-16-1", "code": "03", "title": "DI-16-1", "templateId": "DI-16", "moduleRef": { "moduleName": "DI-16-1", "moduleId": "...", "moduleXmlType": "..." } }
  ],
  "pageOrder": ["page:PS", "page:AS-P", "mod:di-16-1"],
  "terminals": {
    "mod:di-16-1:DI1": { "deviceText": "TE1", "cable1": "NOMAK 4x2x0.5 / K1", "destination": "X1:5" }
  }
}
```

Notes:
- **Pages are deterministic**: they are derived from canonical `module_name` + `module_xml_type` when missing.
- **Terminal rows are keyed** by `${pageId}:${terminal_code}`.
- `automationServerType` is stored in the v2 editor state (document settings). A future migration can mirror it to a center-level column if needed.

## Template library

Module templates live in code: `lib/templates/moduleTemplates.ts` and follow `docs/12_MODULE_TEMPLATE_LIBRARY.md`.

## Tyokirja synchronization

The workbook tab updates canonical rows in:

`document.settings_jsonb.canonical.rows[]`

The API applies patches by row index + field name to support bulk edit and safe renames.

## Automation server types and locked pages

`automationServerType` (stored in the editor v2 state) determines default locked pages:
- If type = `AS-P`: pages **01 (PS)** and **02 (AS-P)** are ensured and locked in order.

Extension point: other server types can add their own default pages/templates without hard-coding business logic into the editor grid.
