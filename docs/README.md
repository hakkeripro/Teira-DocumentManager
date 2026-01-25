# Teira DocumentManager – Spec Pack v1.3

Tämä ZIP sisältää authoritative `docs/`-speksit sekä `docs/mapping/MappingSpec.yaml` (Sprint 2 mapping -totuus).

## Miten tätä käytetään
- **Docs ZIP on source of truth.** Jos repo ja docs ristiriidassa, repo päivitetään vastaamaan docsia.
- Speksit ovat **living documentation**: sprinttien aikana docs pidetään ajan tasalla.

## Tärkeitä huomioita
- Kytkentäkuvien tavoitetila on **editor == tuloste** (moduulisivut + liittimet + kaapelointi + symbolit + laitteet).
- Import tuottaa pohjadatan, jonka päälle tehdään muokattavat täydennykset (merge-säännöt määritelty erikseen).

## UI Contract (WIRING_DIAGRAMS)

- `docs/15_UI_CONTRACT_WIRING_EDITOR.md` lukitsee editorin UI-rakenteen ja print-layoutin.
- Referenssikuvat ovat `docs/ui_refs/wiring_editor_v2/`.
