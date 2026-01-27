# AGENTS.md — TEIRA DocumentManager (Spec-Locked Execution Rules)

This file defines **non-negotiable rules** for any AI agent (Codex/Cursor/other) working in this repository.  
**Docs are the source of truth.** If there is any conflict, follow **docs/** and do not guess.

---

## 1) Core Principles

1. **Docs = Source of Truth**
   - Implement strictly according to `docs/` (authoritative).
   - If a detail is missing or ambiguous, **do not invent**. Log it to `docs/OPEN_ITEMS.md` and request a reference.

2. **No Guessing**
   - If you cannot implement without assumptions, stop and record an OPEN_ITEM with:
     - what is unclear
     - where it impacts behavior/UI/data
     - what exact reference is needed (file/screenshot/XML/PDF)

3. **Security**
   - **NEVER open, print, or modify `.env`** or any secret files.
   - Do not add logging that may leak secrets or personal data.

4. **Change Governance**
   - Spec changes follow: **PROPOSED → user approval → FINAL**.
   - Only apply a spec change as FINAL if the user explicitly approves it.

5. **Patch/PR Hygiene**
   - Small, reviewable changes: **one PR = one theme**.
   - Avoid mass refactors, broad file moves/renames, or formatting sweeps unless explicitly requested.

---

## 2) Authoritative Documents (Read First)

Always consult these before implementing:

- `docs/00_OVERVIEW.md`
- `docs/13_UI_CONTRACT_WIRING_EDITOR.md` (locked wiring editor contract)
- `docs/03_IMPORT_EXPORT.md`
- `docs/04_REVISION_WORKFLOW.md`
- `docs/14_LAYOUT_EDITOR.md`
- `docs/15_GOLDEN_REFERENCES.md`
- `docs/OPEN_ITEMS.md`
- Golden refs:
  - `docs/golden/kytkentäkuva.pdf`
  - `docs/golden/LAYOUT.pdf`
  - `docs/golden/IO_Export_Malli.xml`
  - `docs/ui_refs/*`
  - `docs/golden/rendered/*.png` (if present)

---

## 3) Locked Decisions (Non-Negotiable)

### 3.1 Wiring + Workbook Parity
- Wiring editor and Workbook must achieve **95% visual parity** with golden references.
- Columns/order/headers must match **1:1**.

### 3.2 Pages Tree (Wiring Editor)
- The wiring editor has a **pages tree** on the **left**.
- **A4 wiring page(s) are rendered to the right of the pages tree**, not below.
- **Add module** control must be in the **left card header/top area** above the pages tree.

### 3.3 Folder Expand/Collapse Scope
- Folder expand/collapse is intended **ONLY for the main tree** (Areas/Projects main navigation).
- The wiring editor pages tree **must not** introduce folder expand/collapse as a requirement unless specifically added later by spec.

### 3.4 Import/Export UX
- **No separate Import/Export page** for wiring diagrams.
- Import/Export buttons/actions must be available **inside**:
  - wiring diagram tab
  - workbook tab
- **Only wiring diagrams** support XML export.
- For non-wiring documents, export = **copy/paste from table** (no XML).

### 3.5 XML Export Rules
- XML export must include the **same fields as import** (model: `docs/golden/IO_Export_Malli.xml`).
- XML export **must not include PS / AS-P pages**.

### 3.6 Revision Model (Draft vs Publish)
- **Save = draft save**, does **not** bump revision letter (multiple saves allowed).
- **Publish** creates a new revision (rev bump) and assets (PDF/XML/XLSX/JSON snapshot) when content differs from latest snapshot.
- Revision sequence: **A..Z, AA..AZ, BA..**
- After import when points change:
  - show **“Import changes pending”** banner
  - show preview
  - **Accept must create a new persisted revision (rev bump)** consistent with revision model

### 3.7 Derived Lists
- Cable list: id, type, from, to, pulled-checkbox, comment; grouping regex/configurable; default grouping = prefix before last `_`.
- Device list: manufacturer, code, quantity (derived but editable), identity = code; overrides persist + reset-to-derived.
- Nameplates list: derived + overrides + manual; excluded restore.

### 3.8 Layout Editor
- Must exist: drag/drop components to the center frame.
- Must sync address/place list with wiring diagrams.
- Versioned like other docs.

---

## 4) Wiring Editor Rendering Rules (Operational)

When implementing the print-grid wiring table:

- Must match golden **white table look** (thin borders, black text), not dark theme “input boxes”.
- Group headers and vertical columns must match the golden reference where present.
- Row grouping (terminal vs connector-lines):
  - `groupRows = max(connector_lines.length, 1)` per `terminal_code`
  - Only connector-line columns render per-row:
    - Liitin
    - Kaapeli 1: Pari nro / johdin
    - Välikytkentäpaikka ja liittimet
    - Kaapeli 2: Pari nro / johdin
    - Minne johdetaan: Liitin
  - All other columns must `rowSpan=groupRows` (single cell for the terminal group):
    - Tunnus, Teksti
    - Kaapeli 1: Tyyppi koko nro
    - Kaapeli 2: Tyyppi koko nro
    - Minne johdetaan: Kytkentäpaikka
    - Symboli/Piirrosmerkintä
    - Kytketty, Tarkastettu

Data binding:
- “Liitin” may be multi-line from template connector_lines[] BUT binding remains to the correct terminal/point fields as defined by docs.

---

## 5) Addressing / Reorder Rules

- Internal stable IDs must remain stable.
- Displayed/persisted **address/slot code must update on reorder** (if spec indicates codes update on reorder).
- Exports must reflect updated addresses (no stale state).

---

## 6) OPEN_ITEMS Policy (No Guessing)

If blocked by missing references or ambiguity:

1. Add an item to `docs/OPEN_ITEMS.md` (unique OI-xxx).
2. Include:
   - short title
   - what is missing
   - where it impacts UI/data/export/revision
   - the exact reference needed (file name, screenshot, golden PDF page)

Do not implement speculative behavior.

---

## 7) PR / Patch Requirements (Mandatory)

Every PR must include:

1. **Patch Manifest**
   - List of changed/new files + why each changed.

2. **Test Commands + Results**
   - At minimum (repo root):
     - `pnpm lint`
     - `pnpm exec tsc --noEmit`
     - `pnpm build`
   - If tests exist:
     - `pnpm test`

3. **Parity Evidence (when UI changes)**
   - Provide screenshots aligned to golden refs (DI16 header area clearly visible, plus at least one grouped terminal).

4. **Scope Control**
   - No mass refactor / renames / formatting changes in parity sprints.
   - No dependency upgrades unless explicitly requested or required to fix a defined issue.

---

## 8) Workflow Expectations

- Work in short cycles: **1–3 days per PR**.
- After each PR, provide:
  - what changed (brief)
  - what was validated (commands, screenshots)
  - what remains (OPEN_ITEMS / next PR)

---

## 9) Prohibited Actions

- Opening/modifying `.env` or secrets.
- Introducing new architecture “domains” via large refactors without approval.
- Changing locked UI contract without user approval.
- Implementing features not requested in the current PR scope.

---

## 10) When in Doubt

Stop and ask via `docs/OPEN_ITEMS.md`.  
Default behavior: **prefer correctness and spec alignment over speed**.
