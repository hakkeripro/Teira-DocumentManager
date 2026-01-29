# Document Workspace Shell (Focus Mode + Compact Header)

This document defines the shared shell behavior for all `/documents/*/editor` routes.

## Focus Mode (Fullscreen editing)
- Focus mode is **on by default** whenever a document editor route is opened.
- Focus mode collapses the global left navigation sidebar (desktop included).
- Users can reveal the global sidebar via a **Menu** toggle (drawer-style overlay).
- An **Exit focus** control returns to the documents list.
- On mobile/tablet, focus mode is always enabled by default.

## Compact Header Stack
When focus mode is active, editor pages must use a **single sticky top bar** and avoid redundant headers.

**Top bar contents (compact):**
1. **Breadcrumb** (single line).
2. **Document title + revision + save status** (single block).
3. **Actions:**
   - Wiring editor: **Import XML**, **Export XML**, **Audit**, **Issues**.
   - Other document editors: use equivalent actions but keep the header compact.
4. **Tabs row** (Kytkentäkuva / Työkirja / Pages / Inspector):
   - Desktop: same row or a compact second row.
   - Mobile: may scroll or wrap to a compact second row.

## Fit-to-Page Guardrails
The workspace shell must allow editor-specific fit calculations to use the **actual center viewport element**.
Padding/border and a **safe gutter (16px)** must be subtracted to avoid clipping.
