# Changelog

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
