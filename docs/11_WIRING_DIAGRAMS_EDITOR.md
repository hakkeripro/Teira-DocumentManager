# Wiring diagrams editor (Sprint 3)

This document describes the **WIRING_DIAGRAMS** editor UI (module list + module page), its persisted editor-state, and the XML (ObjectSet) export that merges **canonical data + editor-state**.

## Scope

- Document scope: **per sub_center + docType** (center-scoped document)
- Data scope: **always company_id** (tenant scoped)

The editor is a *separate view on top of canonical rows*.
It **does not refactor or change the import engine**.

## Persisted editor state

Editor state is stored in `document.settings_jsonb`.

Path:

- `settings.editor.WIRING_DIAGRAMS`

Schema (JSON):

```json
{
  "version": 1,
  "updatedAt": "2026-01-22T12:34:56.789Z",
  "moduleOrder": ["MODULE_A", "MODULE_B"],
  "symbols": {
    "X1": { "type": "SENSOR", "label": "T1" },
    "X2": { "type": "RELAY",  "label": "K1" }
  }
}
```

### Keys

- **moduleOrder**
  - Array of module identifiers (currently `module_name` from canonical rows)
  - Used for **module list ordering** and **export ordering**
- **symbols**
  - Map keyed by **terminal_code**
  - Value:
    - `type` (required) — one of the UI symbol types (MVP)
    - `label` (optional)

### Terminal code anchor

Symbol selection is anchored to `terminal_code`.

The UI resolves terminal code by:

1) `row.properties.point_properties.TerminalCode` (preferred, if present)
2) Fallbacks:
   - `IN<channelNo>` when `input_channel_number` exists
   - `OUT<channelNo>` when `output_channel_number` exists
   - `POINT:<point_name>` as a last resort

## UI flows

Routes:

- Documents → `WIRING_DIAGRAMS` → **Open editor**
  - `/app/projects/:projectId/centers/:subCenterId/documents/WIRING_DIAGRAMS/editor`
- Module page:
  - `/app/projects/:projectId/centers/:subCenterId/documents/WIRING_DIAGRAMS/editor/modules/:moduleName`

### Module list

- Shows modules derived from canonical rows (`module_name`, `module_xml_type`, `module_id`)
- Order is editable (MVP: **up/down**) and persisted to `moduleOrder`

### Module page

- Shows channel/point rows for the selected module
- Allows selecting a symbol type and an optional label per terminal_code
- Symbol choice is persisted to `symbols[terminal_code]`

### Validation

If editor state contains symbols referencing an unknown terminal code (not found in current canonical rows):

- UI shows a warning
- Document is still usable (does not crash)
- Unknown symbols are ignored

## XML export (ObjectSet)

The editor provides an explicit **Export XML (ObjectSet)** action.

Export behavior:

- Source: `canonical.rows`
- Apply editor state:
  - Sort rows using `moduleOrder` (modules not in order go to the end)
  - Inject symbol fields into point property bag:
    - `TerminalCode`
    - `SymbolType`
    - `SymbolLabel`
- Export format follows `docs/mapping/MappingSpec.yaml` target `WIRING_DIAGRAMS` (format: objectset)

## Test instructions

1) Import canonical data
   - Go to: Projects → Centers → Import / Export
   - Import XML/XLSX for `WIRING_DIAGRAMS`

2) Open editor
   - Documents → WIRING_DIAGRAMS → Open editor

3) Reorder modules
   - Use ↑/↓ buttons
   - Click **Save order**
   - Refresh page → order persists

4) Add symbols
   - Open a module
   - Select symbol type + label for a terminal
   - Click **Save symbols**
   - Refresh page → symbols persist

5) Export XML
   - Click **Export XML (ObjectSet)**
   - Verify:
     - Modules/rows follow the saved order
     - Exported points contain `SymbolType` / `SymbolLabel` PIs (property bag)
