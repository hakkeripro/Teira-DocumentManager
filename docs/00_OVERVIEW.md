# 00 — Overview / North Star (v1)

## North Star
Teira DocumentManager on pilvessä ajettava (managed SaaS) dokumenttien suunnittelu- ja hallinta-alusta, jolla hallitaan **satoja/tuhansia** rakennusautomaation dokumentteja per projekti. Työkalun päätarkoitus on tukea suunnittelua ja työnjohtoa.

Rajoitukset (anti-goals):
- Ei täysimittaista CAD:ia
- Ei yleistä sähkösuunnittelu-CAD/ECAD -järjestelmää

Työkalun filosofia:
- Vapaa muokkaus (ei pakotettua wizardia)
- Järjestelmä **varoittaa poikkeamista** (esim. kaapeli puuttuu, pisteet muuttuvat importissa), mutta käyttäjä ohjaa lopputulosta.

## V1 dokumenttityypit (in-scope)

Pakolliset (tavoitetila v1):
- **Kytkentäkuvat** (`WIRING_DIAGRAMS`) + Työkirja-tab
- **Laiteluettelo** (johdettu + muokattava)
- **Kaapeliluettelo** (johdettu + muokattava)
- **Kilpiluettelo** (johdettu + muokattava)
- **Testauslista**
- **Layout editor** (center layout) + revisiointi
- **Väyläkaaviot** (toteutetaan myöhemmin; referenssit toimitetaan myöhemmin)

## Lukitut päätökset (A/B-vastaukset)

### UI pariteetti
- Kytkentäkuvaeditorin visuaali: **95%** referensseihin.
- Sarakkeet, järjestys ja otsikot: **1:1** referenssien kanssa.
- Työkirja-tab: sarakkeet + järjestys + otsikot **1:1** referenssin kanssa.

### Navigaatio ja UX
- Vasen puu säilyy. Lisäys: kansio-ikoni ja “kansiomaiset” (mutta **vain UI-ryhmittely**) avattavat/suljettavat ryhmät.
- Ei erillistä Import/Export-sivua kytkentäkuville: Import/Export toiminnot ovat **kytkentäkuvassa ja Työkirjassa**.

### Import/Export
- Vain **kytkentäkuville** tarvitaan XML export (ObjectSet/IO Export -tyyppinen). Muissa dokumenteissa export = copy/paste taulukosta.
- XML export on oltava **rakenteeltaan ja kentiltään** sama kuin `docs/golden/IO_Export_Malli.xml` (golden fixture).
- Export ei sisällä PS/AS-P -sivuja.
- Import: jos moduulit eivät täsmää → error ja estetään. Jos pisteet muuttuvat → varoitus + banneri.

### Revisiohallinta
- Draft vs Publish: Publish tuottaa PDF:t ym. assetit.
- Revisioformaatti kaikille dokumenteille: **A..Z, AA..AZ, BA..**
- Käyttäjä voi tehdä useita Saveja ilman revision kirjaimen kasvua.
- Importin jälkeen UI näyttää “Import changes pending” -bannerin ja hyväksyntä/savetoiminto luo revision (ks. `04_REVISION_WORKFLOW.md`).

### Cable grouping ja multi-IO
- Kaapelit johdetaan ja ryhmitellään regex/konfiguroitavalla säännöllä; oletus: “ennen viimeistä `_`”.
- Jos tunnuksessa ei ole erotinta → ei automaattiryhmittelyä.
- Laitteella voi olla useita IO:ta: laitevalinnassa voidaan valita samaan laitteeseen kuuluvat pisteet → yhteinen kaapeli.

### Derived lists
- Laiteluettelo v1: **valmistaja, koodi, määrä** (määrä johdettu, mutta muokattava; avain = koodi; case-sensitive).
- Kaapeliluettelo v1: tunnus, tyyppi, mistä, mihin, vedetty-checkbox, kommentti; manuaalinen override-ikoni + hover.
- Kilpiluettelo: 2 riviä (tunnus + kuvaus) toimitettaville laitteille.

## Golden references
Katso: `15_GOLDEN_REFERENCES.md`.
