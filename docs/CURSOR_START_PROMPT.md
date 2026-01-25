# Cursor Start — Step 0 (GAP AUDIT)

Käytä tätä promptia Cursorin Composer/Agent -näkymässä.

## Prompt

ROLE
You are a Senior Fullstack/Architect. Do not guess. Use only this repository. Do NOT open any .env files.

SOURCE OF TRUTH
- docs/ is authoritative. Especially docs/13_UI_CONTRACT_WIRING_EDITOR.md is LOCKED.
- Golden references: docs/15_GOLDEN_REFERENCES.md and docs/golden/*.

OBJECTIVE
Produce a concrete “Refactor vs Rebuild” recommendation and a sprint plan to reach the locked product spec.

DELIVERABLES
1) GAP REPORT: what is wrong today vs docs (focus: wiring editor parity, workbook parity, import/export UX, revision semantics, derived lists, publish pipeline).
2) RECOMMENDATION: refactor vs rebuild, with explicit criteria.
3) TARGET ARCHITECTURE: module/service boundaries for wiring, publish, revisions, derived lists.
4) SPRINT PLAN: 3–6 sprints with DoD gates.
5) PATCH STRATEGY: how changes will be delivered (only modified/new files) + which docs updated each sprint.

CONSTRAINTS
- company_id always; center scope where relevant.
- No separate import/export page for wiring.
