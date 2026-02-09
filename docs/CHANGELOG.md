# Changelog

## Sprint 1b — Blockers Fix (2026-01-25)

### User-Approved Spec Updates
- **FINAL-S1**: Folder expand/collapse intended ONLY for main tree (Areas/Projects nav), NOT wiring editor pages tree
- **FINAL-S2**: Wiring editor layout: Pages tree LEFT, A4 drawings RIGHT, "Add module" in LEFT card header/top

### A) Print-Grid Parity Fix
- Changed from dark theme to white table look with thin black borders (per golden ref)
- Updated column structure to exact match `Kytkentakuva_DI16.png`:
  - Tunnus | Teksti | Liitin | Kaapelointitiedot (Pari/Tyyppi/Välikytkentä) | Kaapeli 2 | Minne johdetaan | Kytketty | Tarkastettu
- Added Kytketty/Tarkastettu checkbox columns

### B) Data Visibility Fix
- Point details from canonical rows now appear in Kytkentäkuva view
- Device tag and description populated from workbook data when terminal state is empty

### C) Reorder Address Sync Fix
- Reorder now updates page codes based on new position
- Non-locked pages get sequential codes after reorder
- Updated spec: "Reorder päivittää page_code"

### D) Import Accept Flow Fix
- Import file data now cached as base64 in client state
- Accept no longer requires re-selecting the file
- Accept uses cached data to commit and signals `createRevision=true`

### Type Extensions
- Added `connected` and `verified` boolean fields to `WiringV2TerminalRow`

## Sprint 1 (2026-01-25)
### Print-Grid Parity
- Updated wiring editor print-grid columns to match `docs/ui_refs/wiring_editor_v2/Kytkentakuva_DI16.png` exactly
- New columns: Tunnus, Teksti, Liitin, Kaapeli 1 (Pari nro/Tyyppi koko nro), Välikytkentäpaikka, Kaapeli 2 (Tyyppi/Pari), Minne johdetaan (Liitin/Kytkentäpaikka), Symboli
- Extended `WiringV2TerminalRow` with new fields: `description`, `cable1Pair`, `intermediateTerminal`, `cable2Pair`, `destinationConnector`

### Folder UI Grouping
- Implemented folder-based organization in Pages tree (UI-only, not persisted)
- Two default groups: "System Pages" (PS/AS-P) and "IO Modules"
- Collapsible with folder icons (📁/📂)

### In-Editor Import/Export
- Added Import XML and Export XML buttons to both Kytkentäkuva and Työkirja tabs
- Removed separate page navigation requirement for WIRING import/export
- Tab renamed from "Editor" to "Kytkentäkuva" for Finnish UI consistency

### Import Pending Banner
- Implemented "Import changes pending" banner per `docs/04_REVISION_WORKFLOW.md`
- Shows preview of changes (added/modified counts)
- Accept action signals revision creation (backend implementation pending - see OI-006)
- Dismiss action cancels pending import

### Open Items
- Added OI-006: Import commit revision creation (backend pending)
- Added OI-007: Workbook columns reference parity (Sprint 2)

## v1.4 (2026-01-24)
- Lukittu WIRING_DIAGRAMS-editorin UI-sopimus: `docs/15_UI_CONTRACT_WIRING_EDITOR.md` + referenssikuvat (`docs/ui_refs/wiring_editor_v2/*`).
- Korjattu AS-P-keskuksen lukitut oletussivut: **01 (PS)** ja **02 (AS-P)**.
- Täsmennetty moduulitemplate-malli: print-rivi = IO-kanava, Liitin-solussa stacked `connector_lines[]`; korjattu `G0`-merkintä.
- Päivitetty Sprint Plan: Sprint 5 = Derived lists v1 + Symbolit v2 + PDF publish parity + publish async -valmius; Sprint 6 = Laitekirjasto/BOM + Layout (perusta).
- Päivitetty Derived Lists v1 speksi vastaamaan “derived + editable” -minimitasoa ilman täydellistä device catalogia.
- Lisätty `docs/SPRINT_5_IMPLEMENTATION_PROMPT.md`.

## v1.3.1 (2026-01-23)
- Lisätty `docs/OPEN_ITEMS.md` avoimien päätösten ja referenssitarpeiden hallintaan (sis. “selvitetään sprintissä” + ohje “älä oleta, kysy käyttäjältä”).

## v1.3 (2026-01-23)
- Lukittu “North Star” -suunta: **Teira DocumentManager** kytkentäkuvat editor == tuloste (page model + module templates + terminals).
- Lisätty automaatiopalvelin-tyyppi (`automation_server_type`) ja default-sivujen/lukitusten periaate (AS-P: PS + AS-P, järjestys lukittu).
- Täsmennetty symboli vs laite -erottelu sekä kaapelointi (Kaapeli 1 / Kaapeli 2 -käyttötapa).
- Lisätty Työkirja-tab (copy/paste -painotteinen bulk-edit).

## v1.2 (2026-01-21)
- Lisätty suunta: **keskukset/alakeskukset (SubCenter)** projektin sisälle.
- Dokumentit ja revisiot määritelty jatkossa **keskuskohtaisiksi** (per sub_center + document type).
- Dokumentoitu migraatiopolku: vanhat projektitasoiset dokumentit → “Default/Main” -keskukseen (Sprint 2).
- Import/export täsmennetty center-kontekstille (UI valitsee keskuksen).

## v1.1 (2026-01-20)
- Lukittu tuotanto: Managed SaaS (pilvi), skaalautuvuus oletuksena.
- Lisätty docs/09_PRODUCTION_SAAS.md
- Päivitetty Tech Stack ja Acceptance Criteria SaaS-baseline-vaatimuksilla.

## 2026-01-25 — Docs hardening for Cursor
- Added golden references: docs/golden/* (kytkentäkuva.pdf, LAYOUT.pdf, IO_Export_Malli.xml, rendered PNGs)
- Normalized UI Contract: 13_... authoritative; 15_... deprecated
- Locked decisions incorporated from A/B answers (import/export UX, revision semantics, derived lists fields, cable grouping)
- Added Cursor rules: .cursor/rules/teira.md
- Added docs/CURSOR_START_PROMPT.md
