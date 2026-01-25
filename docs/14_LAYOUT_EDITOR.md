# 14 — Layout Editor (Center Layout) v2 — must have

Layout-editori on keskuksen (center) kaappisuunnittelu.

## Golden reference
- `docs/golden/LAYOUT.pdf`
- `docs/golden/rendered/layout_p0.png`

## Tavoite
- Käyttäjä rakentaa keskusrungon layoutin graafisesti.
- Editorissa on omat graafiset komponentit (drag/drop), joita voi siirtää ja sijoittaa valittuun runkoon.
- Layout linkittyy kytkentäkuviin ja mahdollistaa osoite-/slot-listojen hallinnan.

## Must-have v1
1) Keskusrungon valinta (tausta / rungon kuva)
2) Komponenttien lisääminen, siirto, poistaminen
3) Snap/grid (vähintään perus)
4) Komponentin metadata:
   - tunnus/label
   - paikka/slot
   - (optiona) linkitys wiring-moduuliin
5) **Osoitelista synkassa kytkentäkuvien kanssa**
   - Layoutin komponenteille voidaan liittää osoitteita/slotteja, ja listaa voidaan verrata kytkentäkuvien moduuleihin.
6) Layout tallennetaan ja **versioidaan kuten muut dokumentit** (oma revisiohistoria).

## Datamalli (suuntaa antava)
- Document type: `LAYOUT`
- `document.settings_jsonb.layout` sisältää editorin state JSON:n
- Publish tuottaa vähintään PDF:n (myöhemmin), mutta v1:ssä voidaan tallentaa snapshot.
