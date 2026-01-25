# TEIRA — Project Rules (Always Apply)

## Hard constraints
- Do not guess. If a required detail is missing, add it to `docs/OPEN_ITEMS.md` with a target sprint and ask the user.
- Do NOT open `.env` files.
- `docs/` is authoritative. Especially `docs/13_UI_CONTRACT_WIRING_EDITOR.md` is LOCKED.

## UI parity requirements
- Wiring editor (print-grid) must match reference images (95% visual) and be structurally identical (headers/columns/order 1:1).
- Workbook tab must match the reference (headers/columns/order 1:1) and remain bi-directionally synced with the print-grid.

## Import/Export constraints
- No separate Import/Export page for wiring diagrams.
- Import/Export actions live inside Wiring editor and Workbook tab.
- Only Wiring diagrams require XML export; other docs export via copy/paste.
- XML export must match `docs/golden/IO_Export_Malli.xml` and must exclude PS/AS-P pages.

## Revision workflow
- Revision letters: A..Z, AA..AZ, BA.. across all document types.
- Multiple saves without revision bump must be possible.
- Publish creates revision assets (PDF, XML, snapshot). Import pending must show a banner and user acceptance must create a new revision.

## Derived lists
- Device list: manufacturer + code (identity key) + quantity (derived but editable) + supplied flag.
- Cable list: id/type/from/to/pulled/comment; manual override icon+tooltip.
- Keep derived+override merge policy; provide reset-to-derived.

## Delivery discipline
- Patch delivery: provide only changed/new files.
- Keep docs updated continuously; record unresolved questions in `docs/OPEN_ITEMS.md`.
