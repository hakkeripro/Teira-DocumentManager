# Document Workspace Shell v1 (WIRING) — IMPLEMENTED

Tämä dokumentti kuvaa Document Workspace Shell -toteutuksen WIRING-editorissa.
Se ei muuta UI-contractia, vaan dokumentoi Sprint 1 -toteutuksen rakenteen.

## Scope
- WIRING_DIAGRAMS editori (Kytkentäkuvat).

## Layout (3-pane)
1) **Top bar**
   - Breadcrumbs + doc context
   - Revision placeholder
   - Save-status: Saved ✓ / Saving… / Error
   - Actions: Import XML, Export XML, Audit, Issues badge

2) **Left panel**
   - Structure tabs: Pages / Modules / Devices
   - Pages-lista on flat list (ei kansioita)
   - Add module -kontrolli on vasemman paneelin headerissä

3) **Center panel**
   - A4 print-grid/canvas (existing grid preserved)
   - Zoom controls: [-] [100%] [+] + Fit width (oletus)
   - Panel hallitsee oman scrollauksen

4) **Right panel**
   - Inspector (Selected: Page + Terminal)
   - Issues-paneli (MVP), ryhmittely: Page → Object → Field

## Issues MVP (doc-scope)
Issue-badge laskee vain **current center + current document** -dataa.

MVP-säännöt (nykyinen toteutus):
- Missing cable id (Kaapeli 1)
- Missing pair number (Pari nro)
- Duplicate allocation: (cableId + pairNumber) same document
- Missing connector/terminal field (Liitin)

## Notes
- Import/Export on aina näkyvissä top barissa (ei erillistä import/export-sivua).
