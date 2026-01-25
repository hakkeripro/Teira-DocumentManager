# Open Items – Teira DocumentManager (v1.3.x)

Tämä tiedosto listaa **tietoisesti avoimet** kohdat, joita ei ole vielä lukittu speksissä.  
Periaate: **Älä oleta. Kysy käyttäjältä (Juho) lisätietoja / referenssiä / esimerkkejä aina kun jokin kohta vaikuttaa UI:hin, tietomalliin tai exporteihin.**

## Käyttö
- Päivitä tätä listaa jokaisen sprintin lopussa.
- Kun item on lukittu, merkitse se **DONE** ja linkkaa lopulliseen speksi-kohtaan (md-tiedosto + otsikko).

## Avoimet kohdat

### OI-001 Revision-kirjainlogiikka Z:n jälkeen
- **Mikä:** Revisioformaatti on `{rev_letter}-{project.code}`. Z:n jälkeen käytös lukittava (AA/AB… vai stop).
- **Tarvitaan käyttäjältä:** päätös + testitapaukset (publish 27+ kertaa).
- **Selvitetään sprintissä:** Sprint 5
- **Status:** OPEN

### OI-002 Automaatiopalvelin-tyypit ja oletussivut (AS-P, AS-B, …)
- **Mikä:** Keskuksen `automation_server_type` määrää oletussivut ja lukitukset.
  - AS-P: `01 (PS)` ja `02 (AS-P)` oletuksena; järjestys lukittu, sisältö muokattava; mallivariantteja useita.
  - AS-B ja muut: voivat olla ilman PS:ää / eri moduulirakenne.
- **Tarvitaan käyttäjältä:** lista alkuvaiheen server-tyypeistä + default-sivut + sivupohjien kentät/templaatit.
- **Selvitetään sprintissä:** Sprint 4 (perustuki) / Sprint 6+ (uudet tyypit)
- **Status:** OPEN
  - Sprint 4 toimitus: `automationServerType` tallennetaan editor v2 -tilaan (document.settings). Editor v2 varmistaa oletussivut `01 (PS)` ja `02 (AS-P)` kun type = `AS-P`.
  - Huom: center-tason DB-kenttä `sub_center.automation_server_type` on vielä OPEN (vaatii Prisma schema + migration).
  - Uudet server-tyypit (AS-B, ...) edelleen auki.

### OI-003 PS-sivun (01) ja AS-P-sivun (02) tarkka pohja ja editointisäännöt
- **Mikä:** PS-sivu on tehonlähde ja niitä voi esiintyä myös IO-moduulien välissä. AS-P-sivu riippuu mallista ja on muokattava.
- **Tarvitaan käyttäjältä:** referenssit (sivupohja / kentät / rivit / validointi) + esimerkkiprojektit.
- **Selvitetään sprintissä:** Sprint 4
- **Status:** OPEN
  - Sprint 4 toimitus: AS-P templaten rivit on lukittu referenssikuvan perusteella; PS on edelleen minimitaso ilman lisäreferenssiä jotta sivuja voi jo editoida.
  - AS-P: referenssikuva toimitettu (docs/ui_refs/wiring_editor_v2/Kytkentakuva_AS-P.png) ja terminallistat voidaan toteuttaa sen mukaan. PS: edelleen tarvitaan lisäreferenssi täyteen pohjaan (rivit/print_labelit/validointi).


### OI-011 Template "connector lines" -malli (stacked labels per IO)

- **Mikä:** Referenssit näyttävät, että yksi print-rivi sisältää useita liitinrivejä samassa solussa (esim. DO: NO/C + G + G0).
  Nykyinen toteutus tarvitsee lukituksen: miten `terminal_code` ja `connector_lines[]` mallinnetaan templatessa ja miten bindataan canonicaliin.
- **Tarvitaan käyttäjältä:** vahvistus per moduuli (DI/UI/AO/DO, AS-P) että print-rivi = IO-kanava ja liitinrivit ovat vain visuaalisia (ei erillisiä bindauksia).
- **Selvitetään sprintissä:** Sprint 5 (UI parity + PDF render)
- **Status:** OPEN

### OI-004 “Tyokirja”-tab: copy/paste, (mahd.) import/export formaatti ja rajat
- **Mikä:** Tyokirja on oma tabi kytkentäkuvaeditorissa; pitää määrittää:
  - mitkä sarakkeet ja rivit (UI-tyyli “workbook”)
  - copy/paste käyttäytyminen (aluevalinta, multi-row, tyhjien solujen käsittely)
  - tuetaanko workbook import/export (CSV/XLSX) vai vain copy/paste
- **Tarvitaan käyttäjältä:** minimitaso (copy/paste) + mahdolliset lisävaatimukset (esim. “export workbook”).
- **Selvitetään sprintissä:** Sprint 4
- **Status:** OPEN
  - Sprint 4 toimitus: Tyokirja-tab toteutettu taulukkona, jossa perus "paste TSV" täyttää useita soluja ja muutokset voi tallentaa.
  - Laajemmat rajaukset (aluevalinta, tyhjien solujen logiikka, import/export) vaativat käyttäjän päätökset.

### OI-005 Symbolikirjasto vNext (ikonit vs kontaktit)
- **Mikä:** Alkuun ikoni riittää. Myöhemmin tarvitaan relekontaktit ja tarkempi piirto.
- **Tarvitaan käyttäjältä:** lista symbolityypeistä + renderöintireferenssit (miltä näyttää kytkentäkuvassa).
- **Selvitetään sprintissä:** Sprint 6+
- **Status:** OPEN

### OI-006 Laitekirjasto + BOM/oheistuotteet + “toimituksessa / ei toimituksessa”
- **Mikä:** Laitteilla voi olla optionaalisia IO-pisteitä (esim. taajuusmuuttaja) ja oheistuotteita (esim. vesianturi + anturitasku).
  - Kaikki laitteet eivät ole teidän toimituksessa → vaikuttaa kilpiluetteloon.
- **Tarvitaan käyttäjältä:** minimikentät device catalogiin + BOM-rivien malli + valintalogiikka UI:ssa.
- **Selvitetään sprintissä:** Sprint 5
- **Status:** OPEN

### OI-007 Kaapelimalli: pari/johdin-merkintä, välikytkennät ja Kaapeli 1 / Kaapeli 2 -säännöt
- **Mikä:** Lukittu periaate:
  - suora kenttälaite → moduuli = Kaapeli 1
  - välikytkentä/riviliittimet = Kaapeli 1 + kenttäkaapeli Kaapeli 2
  - pariteksti oletuksena “2 pu / 2 si” (JAMAK) ja “2 or / 2 va” (NOMAK); muokattavissa
- **Tarvitaan käyttäjältä:** lisää esimerkkejä “multi-IO sama kaapeli” + miten välikytkentäpaikka/liittimet täytetään.
- **Selvitetään sprintissä:** Sprint 5
- **Status:** OPEN

### OI-008 Johdetut dokumentit: laiteluettelo, kaapeliluettelo, kilpiluettelo
- **Mikä:** Johdetaan kytkentäkuvista + device catalogista.
  - Kilpiluettelo: 2-sarakkeinen muokattava lista (default: rivi1 tunnus, rivi2 kuvaus).
- **Tarvitaan käyttäjältä:** tarkat “derive rules”: mitä sisältyy aina, mitä on optio, ja miten manuaaliset lisäykset käsitellään.
- **Selvitetään sprintissä:** Sprint 5
- **Status:** OPEN
  - Sprint 5: Kilpiluettelo v1 toteutettu (uusi document type `NAMEPLATE_LIST`): johdetut rivit kytkentäkuvista (deviceText rivi1=tunnus, rivi2=kuvaus), override-kuvaus, manual rows, Exclude + Restore (excluded derived näkyy erillisessä osiossa). Muut derive-rules yhä OPEN.

### OI-009 Layout-editori: kaappirungot, drag/drop, slotit, oheislaitteet
- **Mikä:** Graafinen layout (valitaan kaappirunko esim. SXWOS-2, lisätään moduulit ja oheislaitteet).
- **Tarvitaan käyttäjältä:** rungot (kuvat/mitat/slotit), minimi-interaktiot (snap/grid), ja miten layout linkittyy kytkentäkuvien sivuihin.
- **Selvitetään sprintissä:** Sprint 6+
- **Status:** OPEN

### OI-010 Väyläkaaviot (uusi document type)
- **Mikä:** Lisätään document type “Väyläkaaviot” (scope ja formaatit lukittava).
- **Tarvitaan käyttäjältä:** esimerkit / vaaditut kentät / export/publish.
- **Selvitetään sprintissä:** Sprint 6+
- **Status:** OPEN
