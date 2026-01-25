# 15 — Golden References (UI / PDF / Export parity)

Tämä dokumentti lukitsee referenssimateriaalit, joihin UI- ja publish-putken (PDF/XML) tulee vastata.

## 1) Wiring editor UI (kuvareferenssit)
Hakemisto: `docs/ui_refs/wiring_editor_v2/`
- `Kytkentakuva_Kansi.png`
- `Kytkentakuva_DI16.png`
- `Kytkentakuva_DO-FA.png`
- `Kytkentakuva_AS-P.png`
- `Tyokirja.png`

Vaatimus:
- Sarakkeet, otsikot, järjestys: 1:1
- Visuaali: 95%

## 2) Wiring PDF referenssi
- `docs/golden/kytkentäkuva.pdf`
- Avuksi nopeaan tarkastukseen: `docs/golden/rendered/` sisältää valmiiksi rasteroituja sivuja (esim. `kyt_p8.png`, `kyt_p9.png`, ...).

Vaatimus:
- Publish-PDF:n pitää vastata editorin print-grid -näkymää ja referenssiä (editor == tuloste).

## 3) Layout referenssi
- `docs/golden/LAYOUT.pdf`
- Rasteroitu esikatselu: `docs/golden/rendered/layout_p0.png`

Vaatimus:
- Layout-editorin näkymän pitää olla rakennettavissa tämän referenssin mukaiseksi (komponentit + keskusrungon layout).

## 4) IO Export (XML) golden fixture
- `docs/golden/IO_Export_Malli.xml`

Vaatimus:
- Kytkentäkuvien XML exportin tulee olla rakenteeltaan ja kentiltään yhteensopiva tämän mallin kanssa.
- Import ja export käyttävät samaa kenttäjoukkoa (export sisältää "samät tiedot kuin import").
- Export **ei sisällä** PS/AS-P -sivuja.

## Käyttö hyväksyntässä
- UI: verrataan `docs/ui_refs/*` ja tarvittaessa PDF-rastereihin.
- PDF: verrataan `docs/golden/kytkentäkuva.pdf` ja/tai `docs/golden/rendered/*`.
- XML: verrataan rakennetta `IO_Export_Malli.xml`-malliin.
