# 11 — WIRING_DIAGRAMS Editor vNext (editor == tuloste)

Tämä dokumentti kuvaa kytkentäkuvien tavoitetilan.

## Source of truth
- Lukittu UI Contract: `docs/13_UI_CONTRACT_WIRING_EDITOR.md`
- Kuvat: `docs/ui_refs/wiring_editor_v2/*`
- PDF: `docs/golden/kytkentäkuva.pdf`

Vaatimus:
- UI: 95% visuaali, otsikot/sarakkeet/järjestys 1:1
- Publish: editor == tuloste

## Ydinajatus
- Kytkentäkuvat ovat **kytkentäkuvakirja**: sivuja (moduuli-instansseja) joilla on templatesta tuleva terminal-lista.
- Terminaali (terminal_code) on bindauksen avain (kaapelit, destination, laite).
- Liitin-solu näyttää templatesta tulevat `connector_lines[]` (stacked labels) tulosteen pariteettia varten.

## Pages tree (vasen puu)
- Sivut järjestyksessä, drag/drop.
- Lukitut sivut (AS-P center): 01 PS, 02 AS-P.
- “Kansiot” ovat UI-ryhmittelyä (ei tallennu): kansion ikoni + avaus/sulku.

## Työkirja-tab
- Sarakkeet ja otsikot 1:1 referenssiin.
- Copy/paste (TSV) ensisijainen bulk-edit.
- Synkronointi on kaksisuuntainen: muokkaus print-gridissä näkyy työkirjassa ja päinvastoin.

## Import / Export (WIRING)
- Ei erillistä import/export -sivua.
- Import/Export napit näkyvät sekä kytkentäkuva-tabissa että työkirja-tabissa.
- Vain WIRING exportaa XML:n (`docs/golden/IO_Export_Malli.xml`-mallin mukaisesti).
- Export ei sisällä PS/AS-P -sivuja.

## Kaapelointi ja multi-IO
- Kaapeli-ryhmittely voidaan konfiguroida regexillä (oletus: ennen viimeistä `_`).
- Laitteella voi olla useita IO:ta (esim. taajuusmuuttaja): laitevalinnassa voidaan valita samaan laitteeseen kuuluvat pisteet → yhteinen kaapeli.

## Publish (pariteetti)
- Publish-PDF:n on vastattava editorin print-grid -näkymää.
- Kansisivu + revisiotaulukko: minimitaso ok, rakenne kirjataan publish-dokumentaatioon.
