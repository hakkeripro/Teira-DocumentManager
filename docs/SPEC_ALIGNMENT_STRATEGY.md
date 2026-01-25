# Spec Alignment Strategy — Wiring Editor & Publish Pipeline

**Date:** 2026-01-25  
**Status:** DRAFT  
**Author:** Architecture Review  

---

## Executive Summary

This document provides a gap analysis between the current implementation and the locked product specification (`docs/13_UI_CONTRACT_WIRING_EDITOR.md`), followed by a refactor vs rebuild recommendation, target architecture, sprint plan, and patch strategy.

**Recommendation: REFACTOR** — The existing codebase provides ~60% of required functionality with sound foundations. A targeted refactor (4-5 sprints) is more efficient than a rebuild.

---

## 1. GAP REPORT

### 1.1 Wiring Editor Parity

| Spec Requirement | Current State | Gap Severity |
|------------------|---------------|--------------|
| **Two tabs: Kytkentäkuva + Työkirja** | ✅ Implemented (`WiringEditorV2Client.tsx`) | None |
| **Pages tree (left sidebar)** | ✅ Present with drag-drop | None |
| **Folder UI grouping (kansio-ikonit)** | ❌ Missing — pages are flat list | MEDIUM |
| **Locked pages (01 PS, 02 AS-P)** | ✅ Implemented for AS-P server type | None |
| **Print-grid column structure 1:1** | ⚠️ Partial — columns exist but not 1:1 with reference | HIGH |
| **Liitin multi-line (connector_lines)** | ⚠️ Template has `print_label` but no stacked rendering | HIGH |
| **Sarakkeet match `Kytkentakuva_DI16.png`** | ⚠️ Column headers differ from reference | HIGH |
| **Module templates (DI-16, UI-16, AO-V-8, DO-FA-12, PS, AS-P)** | ✅ Implemented in `moduleTemplates.ts` | None |
| **A4 portrait aspect ratio** | ❌ Missing — no print-layout CSS | MEDIUM |

### 1.2 Workbook (Työkirja) Parity

| Spec Requirement | Current State | Gap Severity |
|------------------|---------------|--------------|
| **Sarakkeet 1:1 with `Tyokirja.png`** | ⚠️ Columns differ from reference | HIGH |
| **TSV copy/paste bulk-edit** | ✅ Implemented | None |
| **Bidirectional sync (print-grid ↔ workbook)** | ❌ Missing — workbook edits canonical rows, but print-grid uses separate `terminals` state | HIGH |
| **Same Import/Export buttons as Kytkentäkuva** | ❌ Missing — no import/export in workbook tab | MEDIUM |

### 1.3 Import/Export UX

| Spec Requirement | Current State | Gap Severity |
|------------------|---------------|--------------|
| **No separate Import/Export page for WIRING** | ❌ Violated — Import lives at `/centers/:id/import` | HIGH |
| **Import/Export inside editor tabs** | ❌ Missing — must navigate away | HIGH |
| **XML export matches golden `IO_Export_Malli.xml`** | ⚠️ Partial — structure exists, field mapping untested | MEDIUM |
| **Export excludes PS/AS-P pages** | ❌ Not implemented | MEDIUM |
| **Module mismatch → ERROR + block** | ❌ Not implemented | MEDIUM |
| **Point changes → "Import changes pending" banner** | ❌ Not implemented | HIGH |
| **Preview + accept flow** | ❌ Not implemented | HIGH |

### 1.4 Revision Semantics

| Spec Requirement | Current State | Gap Severity |
|------------------|---------------|--------------|
| **Draft vs Publish model** | ⚠️ Revisions exist but no explicit draft concept | MEDIUM |
| **Multiple saves without rev increment** | ❌ Unclear — current save behavior not aligned | MEDIUM |
| **Publish creates assets (PDF, JSON, XML)** | ⚠️ Partial — PDF route exists, XML export separate | MEDIUM |
| **Rev format: A→Z→AA→AZ→BA...** | ✅ Implemented (`revDisplay`) | None |
| **Import acceptance creates revision** | ❌ Not implemented | HIGH |
| **Kansisivu + revisiotaulukko in PDF** | ❌ Not implemented | MEDIUM |

### 1.5 Derived Lists

| Spec Requirement | Current State | Gap Severity |
|------------------|---------------|--------------|
| **Kilpiluettelo (Nameplates)** | ✅ Implemented (`nameplatesV1.ts`) | None |
| **Laiteluettelo (Device List)** | ❌ Not implemented — only `DEVICE_LIST` docType exists | HIGH |
| **Kaapeliluettelo (Cable List)** | ❌ Not implemented — only `PULL_LIST` docType exists | HIGH |
| **Cable grouping regex** | ❌ Not implemented | MEDIUM |
| **Multi-IO device selection** | ❌ Not implemented | MEDIUM |
| **Override + Reset to derived** | ✅ Implemented for nameplates only | None |

### 1.6 Publish Pipeline

| Spec Requirement | Current State | Gap Severity |
|------------------|---------------|--------------|
| **PDF generation from print-grid** | ⚠️ `/api/revisions/[id]/pdf` exists but generates from stored asset, not editor | MEDIUM |
| **Editor == Tuloste parity** | ❌ Not verified — no PDF generation from editor state | HIGH |
| **Cover page generation** | ❌ Not implemented | MEDIUM |
| **Revision table on cover** | ❌ Not implemented | MEDIUM |
| **XML export as publish asset** | ❌ Not linked to revision | MEDIUM |

---

## 2. RECOMMENDATION: REFACTOR vs REBUILD

### 2.1 Assessment Criteria

| Criterion | Refactor | Rebuild |
|-----------|----------|---------|
| **Existing foundation quality** | Good — Prisma schema, API structure, auth, Next.js patterns are solid | N/A |
| **Code reuse potential** | ~60% of lib/ and API routes reusable | 0% |
| **Risk** | Low — incremental changes | High — all-or-nothing |
| **Time-to-value** | 4-5 sprints | 6-8 sprints |
| **Technical debt** | Can address incrementally | Fresh start but deferred learning |
| **Team continuity** | Preserves knowledge | Requires re-learning |

### 2.2 Decision: **REFACTOR**

**Rationale:**

1. **Sound Foundation**: The existing Prisma schema, document model, and API patterns (actor/company scoping, permissions) are correct and reusable.

2. **V2 State Model is Close**: `wiringEditorV2.ts` already has the page-based model, templates, and terminal state. It needs extension, not replacement.

3. **No Architectural Blockers**: The gaps are primarily:
   - UI layout/column alignment (CSS + JSX)
   - Missing features (import in editor, bidirectional sync)
   - Integration gaps (publish pipeline, derived lists)

4. **Cost of Rebuild**: A rebuild would discard working auth, storage adapters, import engine, and mapping spec — all correctly implemented.

### 2.3 Refactor Principles

1. **Additive Changes First**: Add missing features before modifying existing ones.
2. **Contract-First**: Lock UI component contracts with props interfaces before implementation.
3. **Test Golden References**: Validate against `docs/golden/*` at each sprint.
4. **No Breaking Changes to API**: Maintain backward compatibility for existing data.

---

## 3. TARGET ARCHITECTURE

### 3.1 Module Boundaries

```
┌─────────────────────────────────────────────────────────────────┐
│                        WIRING DOMAIN                            │
├─────────────────────────────────────────────────────────────────┤
│  lib/wiring/                                                    │
│  ├── state.ts          # WiringV2State + patches                │
│  ├── templates.ts      # Module templates (existing)            │
│  ├── sync.ts           # Bidirectional sync (print ↔ workbook)  │
│  ├── importValidation.ts # Module mismatch + point diff         │
│  └── export.ts         # XML export (PS/AS-P exclusion)         │
├─────────────────────────────────────────────────────────────────┤
│  components/wiring/                                             │
│  ├── EditorShell.tsx   # Container: tabs, toolbar, sidebar      │
│  ├── PageTree.tsx      # Left sidebar with folder grouping      │
│  ├── PrintGrid.tsx     # A4 print-grid (1:1 columns)            │
│  ├── Workbook.tsx      # Excel-like grid (1:1 columns)          │
│  ├── ImportPanel.tsx   # In-editor import with preview          │
│  └── ExportPanel.tsx   # In-editor export (XML download)        │
├─────────────────────────────────────────────────────────────────┤
│  app/api/wiring/                                                │
│  ├── state/route.ts    # Unified state PATCH                    │
│  ├── import/route.ts   # Import with validation (in-editor)     │
│  └── export/route.ts   # XML export (excludes PS/AS-P)          │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                       PUBLISH DOMAIN                            │
├─────────────────────────────────────────────────────────────────┤
│  lib/publish/                                                   │
│  ├── pdfGenerator.ts   # Generate PDF from editor state         │
│  ├── coverPage.ts      # Cover page + revision table            │
│  └── assets.ts         # Asset management (PDF, JSON, XML)      │
├─────────────────────────────────────────────────────────────────┤
│  app/api/publish/                                               │
│  ├── draft/route.ts    # Save without revision                  │
│  └── commit/route.ts   # Create revision + assets               │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      REVISION DOMAIN                            │
├─────────────────────────────────────────────────────────────────┤
│  lib/revisions/                                                 │
│  ├── revisionFormat.ts # A→Z→AA logic (existing)                │
│  ├── snapshot.ts       # JSON snapshot generation               │
│  └── diffPreview.ts    # Import changes preview                 │
├─────────────────────────────────────────────────────────────────┤
│  app/api/revisions/                                             │
│  ├── list/route.ts     # List revisions for document            │
│  └── [id]/             # Get revision + assets                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    DERIVED LISTS DOMAIN                         │
├─────────────────────────────────────────────────────────────────┤
│  lib/derivedLists/                                              │
│  ├── nameplatesV1.ts   # (existing)                             │
│  ├── deviceListV1.ts   # Derive from wiring + override          │
│  ├── cableListV1.ts    # Cable grouping + derive                │
│  └── types.ts          # Shared types                           │
├─────────────────────────────────────────────────────────────────┤
│  components/derivedLists/                                       │
│  ├── DeviceListEditor.tsx                                       │
│  ├── CableListEditor.tsx                                        │
│  └── NameplateListEditor.tsx # (existing component to refactor) │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Data Flow

```
                    ┌──────────────────┐
                    │  Import (XML)    │
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
                    │  Validation      │
                    │  (module check)  │
                    └────────┬─────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
    ┌────▼────┐        ┌─────▼─────┐       ┌─────▼─────┐
    │ Canonical│◄──────►│ WiringV2 │◄──────►│ Terminals │
    │  Rows   │  sync   │  State   │  sync  │  (print)  │
    └────┬────┘        └─────┬─────┘       └─────┬─────┘
         │                   │                   │
         │              ┌────▼────┐              │
         │              │ Workbook │◄────────────┘
         │              └─────────┘      bidirectional
         │
    ┌────▼────────────────────────────────────────────┐
    │                  PUBLISH                         │
    │  ┌─────────┐  ┌─────────┐  ┌─────────────────┐  │
    │  │  PDF    │  │  JSON   │  │  XML (no PS/AS) │  │
    │  └─────────┘  └─────────┘  └─────────────────┘  │
    └────┬────────────────────────────────────────────┘
         │
    ┌────▼────┐
    │Revision │
    │ Assets  │
    └─────────┘
```

### 3.3 Key Interfaces

```typescript
// Wiring Editor State (extended from existing)
interface WiringV2State {
  version: 1;
  updatedAt: string;
  automationServerType: 'AS-P' | null;
  pages: WiringV2Page[];
  pageOrder: string[];
  terminals: Record<string, WiringV2TerminalRow>;
  // NEW: folder grouping (UI only, not persisted to canonical)
  folderGroups?: { id: string; name: string; pageIds: string[] }[];
}

// Extended terminal row for print parity
interface WiringV2TerminalRow {
  deviceText?: string;          // Tunnus / Teksti
  connectorLines?: string[];    // Liitin (stacked)
  cable1Type?: string;          // Kaapeli 1: Tyyppi/koko/nro
  cable1Intermediate?: string;  // Kaapeli 1: Välikytkentäpaikka
  cable1Pair?: string;          // Kaapeli 1: Pari nro/johdin
  cable2Type?: string;          // Kaapeli 2: Tyyppi/koko/nro
  cable2Pair?: string;          // Kaapeli 2: Pari nro/johdin
  destinationConnector?: string;// Minne johdetaan: Liitin
  destinationPlace?: string;    // Minne johdetaan: Kytkentäpaikka
  symbol?: { type: string; label?: string };
}

// Import validation result
interface ImportValidationResult {
  ok: boolean;
  moduleMatch: 'exact' | 'mismatch';
  mismatchedModules?: string[];
  pointChanges: {
    added: CanonicalRow[];
    modified: CanonicalRow[];
    removed: string[];
  };
  canProceed: boolean; // false if module mismatch
}

// Publish request
interface PublishRequest {
  documentId: string;
  changeNote?: string;
  // Publish creates revision only if draft ≠ last revision
}
```

---

## 4. SPRINT PLAN

### Sprint 6: Wiring Editor UI Parity (Print-Grid)

**Duration:** 2 weeks  
**Focus:** Print-grid column structure 1:1 with golden reference

**Deliverables:**
- [ ] Refactor `PrintGrid` columns to match `Kytkentakuva_DI16.png` exactly
- [ ] Implement `connectorLines` stacked rendering in Liitin column
- [ ] Extend `WiringV2TerminalRow` with full field set
- [ ] A4 portrait aspect ratio CSS
- [ ] Folder grouping UI in PageTree (collapsible, icons)

**DoD Gate:**
- Screenshot comparison to `docs/ui_refs/wiring_editor_v2/Kytkentakuva_DI16.png` — 90% match
- Column headers exactly match reference
- Folder groups expand/collapse

**Files Modified:**
- `components/wiring/PrintGrid.tsx` (new, extracted from WiringEditorV2Client)
- `components/wiring/PageTree.tsx` (new)
- `lib/wiringEditorV2.ts` (extend types)
- `components/WiringEditorV2Client.tsx` (refactor to use new components)

**Docs Updated:**
- `CHANGELOG.md`
- `docs/11_WIRING_EDITOR_VNEXT.md` (implementation notes)

---

### Sprint 7: Workbook Parity + Bidirectional Sync

**Duration:** 2 weeks  
**Focus:** Workbook columns 1:1 + sync with print-grid

**Deliverables:**
- [ ] Refactor Workbook columns to match `Tyokirja.png` exactly
- [ ] Implement bidirectional sync engine (`lib/wiring/sync.ts`)
- [ ] Print-grid edits update canonical rows
- [ ] Workbook edits update terminals state
- [ ] Real-time sync (no manual save required)

**DoD Gate:**
- Screenshot comparison to `docs/ui_refs/wiring_editor_v2/Tyokirja.png` — 90% match
- Edit in workbook → immediate reflection in print-grid
- Edit in print-grid → immediate reflection in workbook

**Files Modified:**
- `components/wiring/Workbook.tsx` (new, extracted)
- `lib/wiring/sync.ts` (new)
- `app/api/wiring-diagrams/v2/state/route.ts` (extend patch logic)

**Docs Updated:**
- `CHANGELOG.md`

---

### Sprint 8: In-Editor Import/Export + Validation

**Duration:** 2 weeks  
**Focus:** Import/Export inside editor tabs (not separate page)

**Deliverables:**
- [ ] In-editor Import panel (both tabs)
- [ ] In-editor Export panel (XML download)
- [ ] Import validation: module mismatch → ERROR + block
- [ ] Import validation: point changes → "Import changes pending" banner
- [ ] Preview + Accept flow for imports
- [ ] XML export excludes PS/AS-P pages
- [ ] XML export validated against `IO_Export_Malli.xml` structure

**DoD Gate:**
- No navigation to `/import` page for WIRING
- Module mismatch blocks import with clear error
- Point changes show diff preview
- Accept creates revision
- Export XML passes structure validation

**Files Modified:**
- `components/wiring/ImportPanel.tsx` (new)
- `components/wiring/ExportPanel.tsx` (new)
- `lib/wiring/importValidation.ts` (new)
- `lib/wiring/export.ts` (new, or extend existing)
- `app/api/wiring/import/route.ts` (new)
- `app/api/wiring/export/route.ts` (new or refactor from export-xml)

**Docs Updated:**
- `CHANGELOG.md`
- `docs/03_IMPORT_EXPORT.md` (implementation notes)

---

### Sprint 9: Revision Workflow + Publish Pipeline

**Duration:** 2 weeks  
**Focus:** Draft/Publish model + PDF generation

**Deliverables:**
- [ ] Draft save (no revision increment)
- [ ] Publish commit (revision + assets)
- [ ] PDF generation from editor state (editor == tuloste)
- [ ] Cover page with revision table
- [ ] JSON snapshot as revision asset
- [ ] XML export as revision asset
- [ ] Import acceptance creates revision

**DoD Gate:**
- Multiple saves do not increment revision
- Publish creates revision A, B, C... correctly
- PDF matches print-grid visually
- Cover page exists with revision history
- Assets stored correctly (local/supabase)

**Files Modified:**
- `lib/publish/pdfGenerator.ts` (new)
- `lib/publish/coverPage.ts` (new)
- `lib/revisions/snapshot.ts` (new)
- `app/api/publish/draft/route.ts` (new)
- `app/api/publish/commit/route.ts` (new)

**Docs Updated:**
- `CHANGELOG.md`
- `docs/04_REVISION_WORKFLOW.md` (implementation notes)

---

### Sprint 10: Derived Lists (Device + Cable)

**Duration:** 2 weeks  
**Focus:** Device list and cable list derivation

**Deliverables:**
- [ ] Device list derivation from wiring data
- [ ] Device list editor with override + reset
- [ ] Cable list derivation with regex grouping
- [ ] Cable list editor with override + reset
- [ ] Multi-IO device selection in wiring editor
- [ ] Derived lists linked to publish pipeline

**DoD Gate:**
- Device list columns match spec (Koodi, Valmistaja, Määrä, Kuvaus, Toimituksessa)
- Cable list columns match spec (Tunnus, Tyyppi, Mistä, Mihin, Vedetty, Kommentti)
- Override indicator visible
- Reset to derived works
- Multi-IO device selection functional

**Files Modified:**
- `lib/derivedLists/deviceListV1.ts` (new)
- `lib/derivedLists/cableListV1.ts` (new)
- `components/derivedLists/DeviceListEditor.tsx` (new)
- `components/derivedLists/CableListEditor.tsx` (new)
- Prisma schema update (if needed for cable regex config)

**Docs Updated:**
- `CHANGELOG.md`
- `docs/13_DERIVED_LISTS_AND_NAMEPLATES.md` (implementation notes)

---

### Sprint 11 (Optional): Polish + Integration Testing

**Duration:** 1-2 weeks  
**Focus:** Bug fixes, edge cases, golden reference validation

**Deliverables:**
- [ ] Full E2E test against golden references
- [ ] PDF visual diff against `docs/golden/kytkentäkuva.pdf`
- [ ] XML structure validation against `docs/golden/IO_Export_Malli.xml`
- [ ] Performance optimization for large documents
- [ ] Documentation cleanup

**DoD Gate:**
- All golden reference tests pass
- No critical bugs
- User acceptance sign-off

---

## 5. PATCH STRATEGY

### 5.1 Delivery Model

**Incremental Patches**: Each sprint delivers a set of modified/new files that can be applied independently.

**Branch Strategy:**
- Feature branches per sprint: `feature/sprint-6-print-grid`
- PR into `main` at sprint completion
- No long-lived feature branches

### 5.2 File Change Categories

| Category | Approach |
|----------|----------|
| **New files** | Added to designated directories per architecture |
| **Modified files** | Minimal changes, preserve existing API contracts |
| **Refactored files** | Split large files into focused modules |
| **Deprecated files** | Marked with `// @deprecated` + removal date |

### 5.3 Sprint-by-Sprint File Manifest

#### Sprint 6 (Print-Grid)
```
NEW:
  components/wiring/PrintGrid.tsx
  components/wiring/PageTree.tsx
  components/wiring/EditorShell.tsx

MODIFIED:
  lib/wiringEditorV2.ts (type extensions)
  components/WiringEditorV2Client.tsx (refactor to shell)

DOCS:
  CHANGELOG.md
  docs/11_WIRING_EDITOR_VNEXT.md
```

#### Sprint 7 (Workbook Sync)
```
NEW:
  components/wiring/Workbook.tsx
  lib/wiring/sync.ts

MODIFIED:
  app/api/wiring-diagrams/v2/state/route.ts
  components/wiring/EditorShell.tsx

DOCS:
  CHANGELOG.md
```

#### Sprint 8 (Import/Export)
```
NEW:
  components/wiring/ImportPanel.tsx
  components/wiring/ExportPanel.tsx
  lib/wiring/importValidation.ts
  lib/wiring/export.ts
  app/api/wiring/import/route.ts
  app/api/wiring/export/route.ts

MODIFIED:
  components/wiring/EditorShell.tsx (add panels)

DEPRECATED:
  app/app/.../import/page.tsx (for WIRING only)

DOCS:
  CHANGELOG.md
  docs/03_IMPORT_EXPORT.md
```

#### Sprint 9 (Revision/Publish)
```
NEW:
  lib/publish/pdfGenerator.ts
  lib/publish/coverPage.ts
  lib/publish/assets.ts
  lib/revisions/snapshot.ts
  app/api/publish/draft/route.ts
  app/api/publish/commit/route.ts

MODIFIED:
  app/api/revisions/[revisionId]/pdf/route.ts

DOCS:
  CHANGELOG.md
  docs/04_REVISION_WORKFLOW.md
```

#### Sprint 10 (Derived Lists)
```
NEW:
  lib/derivedLists/deviceListV1.ts
  lib/derivedLists/cableListV1.ts
  components/derivedLists/DeviceListEditor.tsx
  components/derivedLists/CableListEditor.tsx
  app/app/.../documents/DEVICE_LIST/editor/page.tsx
  app/app/.../documents/CABLE_LIST/editor/page.tsx

MODIFIED:
  prisma/schema.prisma (if config needed)
  lib/derivedLists/types.ts

DOCS:
  CHANGELOG.md
  docs/13_DERIVED_LISTS_AND_NAMEPLATES.md
```

### 5.4 Rollback Strategy

Each sprint's changes are isolated to specific modules. If a sprint fails acceptance:

1. Revert PR merge on `main`
2. Continue from previous sprint's stable state
3. Re-plan failed sprint with adjusted scope

### 5.5 Documentation Updates

Every sprint updates:
- `CHANGELOG.md` — What changed
- Relevant spec doc — Implementation notes section

Documentation freeze occurs after Sprint 10 for final review.

---

## Appendix A: Golden Reference Validation Checklist

### Print-Grid (Kytkentäkuva)
- [ ] Column headers match `Kytkentakuva_DI16.png` exactly
- [ ] Liitin shows stacked lines (connector_lines)
- [ ] A4 portrait aspect ratio
- [ ] PS/AS-P pages show correct terminals

### Workbook (Työkirja)
- [ ] Column headers match `Tyokirja.png` exactly
- [ ] TSV paste works correctly
- [ ] Real-time sync with print-grid

### PDF Output
- [ ] Visual diff against `docs/golden/rendered/kyt_p*.png` — 95% match
- [ ] Cover page present
- [ ] Revision table accurate

### XML Export
- [ ] Structure matches `IO_Export_Malli.xml`
- [ ] PS/AS-P pages excluded
- [ ] All PI fields present

---

## Appendix B: Risk Register

| Risk | Impact | Mitigation |
|------|--------|------------|
| PDF generation complexity | HIGH | Use existing pdf-lib; fallback to Puppeteer |
| Bidirectional sync bugs | MEDIUM | Extensive unit tests; optimistic UI |
| Template mismatch on import | HIGH | Strict validation; clear error messages |
| Large document performance | MEDIUM | Virtualized lists; lazy loading |
| Migration of existing data | LOW | V2 state is additive; existing data preserved |

---

*End of Document*
