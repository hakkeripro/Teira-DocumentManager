# OPEN_ITEMS (authoritative)

Periaate: **Älä oleta**. Kun referenssi tai päätös puuttuu, lisää item tänne ja pyydä käyttäjältä (Juho) tarvittava lisäinfo.

Tässä tiedostossa on vain aidosti avoimet kohdat. Lukitut päätökset löytyvät `docs/00_OVERVIEW.md` ja UI Contractista.

## DONE (viimeisimmät lukitukset)
- Revision letters: **A..Z, AA..AZ, BA..** (lukittu `04_REVISION_WORKFLOW.md`).
- WIRING Import/Export: **ei erillistä import/export-sivua**, vain editorissa; **vain WIRING exportaa XML:n** (lukittu `03_IMPORT_EXPORT.md`).
- WIRING UI Contract: `13_UI_CONTRACT_WIRING_EDITOR.md` authoritative; `15_UI_CONTRACT...` deprecated.

## OPEN

### OI-001 AS-P `terminal_code` -skeema (Target: Sprint 0/1)
**Miksi:** AS-P connector_lines voidaan toteuttaa referenssillä, mutta täydellinen `terminal_code`-malli (jotta binding/export/validation ovat deterministisiä) tarvitsee varmistuksen.
- Tarvitaan käyttäjältä: vahvistus AS-P:n liitinrivien ryhmittelystä ja nimeämisestä (terminal_code vs vain print-label).
- Hyväksyntäkriteeri: yksi selkeä, dokumentoitu skeema + testifixture.

### OI-002 Kaapeli-ryhmittelyn regex-konfigurointi (Target: Sprint 0/1)
**Miksi:** oletusryhmittely (ennen viimeistä `_`) ei kata kaikkia asiakaskäytäntöjä.
- Tarvitaan käyttäjältä: 3–5 todellista esimerkkikaapelitunnusta (ryhmittely onnistuu / ei onnistu) + toivottu regex.
- Päätös: missä konfiguraatio asuu (company settings / project / center) ja miten sitä muokataan (UI vai config).

### OI-003 Publish: kansi + revisiotaulukon sisältö (Target: Sprint 0/1)
**Miksi:** “minimitaso ok” on hyväksytty, mutta jotta toteutus ei ajaudu väärään suuntaan, tarvitaan sisältö/otsikot.
- Tarvitaan käyttäjältä: esimerkkipdf tai lista kentistä (projektin nimi, keskus, päiväys, tekijä, muutokset, jne.).

### OI-004 Laitekirjasto (device catalog) ja BOM (Target: myöhemmin)
**Miksi:** Derived lists v1 toimii ilman catalogia, mutta valmistaja/koodi/qty-derivointi paranee catalogilla.
- Tarvitaan käyttäjältä: minimikentät device catalogiin + BOM/oheistuotteet + “toimituksessa” -logiikka.

### OI-005 Väyläkaaviot + osoitelista (Target: myöhemmin)
- Tarvitaan käyttäjältä: referenssit ja sisältövaatimukset.

### OI-006 Import commit revision creation (Target: Sprint 1 followup)
**Miksi:** Sprint 1 implements the "Import changes pending" banner and accept flow in the UI, but the backend `/api/import/commit` endpoint does not yet create a new revision on accept.
- **Current state:** The `createRevision` form field is passed but not handled server-side.
- **Required implementation:** When `createRevision=true`, the commit endpoint should:
  1. Create new DocumentRevision with rev letter bump (A→B→...→Z→AA)
  2. Store JSON snapshot as revision asset
  3. Return the new revision ID to the client
- **Workaround (Sprint 1):** Page reload after accept will load the new data, but revision history is not updated.

### OI-007 Workbook columns reference parity (Target: Sprint 2)
**Miksi:** The Työkirja tab columns were not updated in Sprint 1 to match `docs/ui_refs/wiring_editor_v2/Tyokirja.png`.
- The reference shows columns: Type, Name, Description, Module ID, Channel, Label text, Invert, LED color, LED Invert, Reset counter, Thermistor, Electrical bottom, Electrical top, Eng...
- Current columns are a simplified set from canonical rows.
- **Required:** Map workbook columns 1:1 to golden reference.

### OI-008 Issues MVP: connector/terminal field definition (Target: Sprint 1 follow-up)
**Miksi:** Issues MVP needs a clear source field for “Missing connector/terminal field” in WIRING.
- Tarvitaan käyttäjältä: vahvistus kentästä (esim. destination connector vs. other connector field) + referenssi (screenshot/pdf sivu).
- Vaikutus: Issues-laskenta ja Inspectorin fokusointi.
