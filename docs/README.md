# Teira DocumentManager — Authoritative Docs

Tämä kansio (`docs/`) on projektin **source of truth**. Toteutuksen (Cursor/Claude/ihminen) tulee noudattaa näitä dokumentteja.

## Lukitut sopimukset

1) **WIRING_DIAGRAMS UI Contract (LUKITTU)**
- `13_UI_CONTRACT_WIRING_EDITOR.md`
- Poikkeamat vaativat käyttäjän erillisen hyväksynnän.

2) **Golden references (UI/PDF/Export-pariteetti)**
- `15_GOLDEN_REFERENCES.md`
- Materiaalit: `docs/golden/*` ja `docs/ui_refs/*`

## Kriittiset suunnitteludokumentit

- `00_OVERVIEW.md` — North Star + lukitut päätökset (A/B-vastaukset)
- `11_WIRING_EDITOR_VNEXT.md` — kytkentäkuvaeditorin tavoitetila (editor == tuloste)
- `12_MODULE_TEMPLATE_LIBRARY.md` — moduulitemplatet + connector lines (stacked labels)
- `03_IMPORT_EXPORT.md` — kytkentäkuvien XML import/export (vain WIRING) + UX
- `04_REVISION_WORKFLOW.md` — draft/publish + revisioformaatti (A..Z, AA..)
- `13_DERIVED_LISTS_AND_NAMEPLATES.md` — laite/kaapeli/kilpi: derivointi + merge-policy
- `14_LAYOUT_EDITOR.md` — layout editor (must-have) + linkki referenssiin
- `OPEN_ITEMS.md` — avoimet päätökset ja niiden target sprint

## Huomioita Cursor-käyttöön

- Projektin pysyvät Cursor-säännöt ovat: `.cursor/rules/teira.md` (versionhallittu).
- ÄLÄ AVAA `.env`-tiedostoja.
- UI/PDF/export tulee toteuttaa parity-periaatteella golden-referensseihin.

## Deprecated

- `15_UI_CONTRACT_WIRING_EDITOR.md` on **deprecated** ja olemassa vain taaksepäin yhteensopivuuden vuoksi.
