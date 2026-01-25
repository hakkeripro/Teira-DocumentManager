# Teira DocumentManager – Overview (Spec Pack v1.3)

## Tavoite
Rakennusautomaatio-urakoitsijan dokumenttihallinnan sovellus (web, desktop-first).  
Sovellus tuottaa ja ylläpitää keskuksittain dokumentit, joista tärkein on **kytkentäkuvakirja**: muokattava näkymä, jonka **editori on sama kuin tuloste**.

## Keskeiset dokumenttityypit (tavoitetila)
Jokaisella keskuksella on oma dokumenttikokonaisuus (center-scope):
- **Kytkentäkuvat (WIRING_DIAGRAMS)**: moduulisivut + liittimet + symbolit + kaapelointi + kytkentäpaikat/laitteet
- **Testauslista (TEST_LIST)**: oma editor + import
- **Laiteluettelo (DEVICE_LIST)**: johdettu kytkentäkuvista + laitekirjastosta (BOM/oheistuotteet)
- **Kaapeliluettelo (PULL_LIST / Cable list)**: johdettu kytkentäkuvien kaapeloinnista
- **Layout (CENTER_LAYOUT)**: keskuksen kaappisuunnittelu (graafinen)
- **Väyläkaaviot (BUS_DIAGRAMS)**: myöhempi dokumenttityyppi
- **Kilpiluettelo (NAMEPLATES)**: 2-sarakkeinen muokattava lista toimitettaville kenttälaitteille

> Huom: MappingSpec.yaml:ssa on Sprint 2 -tason docTypet. Uudet docTypet lisätään myöhemmissä speksipäivityksissä.

## Tuotanto (hard requirement)
- Tuotantoversio on **pilvessä (Managed SaaS)**.
- Käyttö voi kasvaa merkittävästi → arkkitehtuuri suunnitellaan **horisontaalisesti skaalautuvaksi** ja myöhempää job-queue/worker-mallia varten.
- EU/GDPR: data ensisijaisesti EU-alueella.

## Periaatteet
- **Tenant-scope:** kaikki data aina `company_id` scopessa. Center-scope: `sub_center_id` missä relevanttia.
- **Editor == tuloste:** kytkentäkuvien editori vastaa sivupohjaa, jonka perusteella PDF generoidaan.
- **Draft vs Publish:** Draft on muokattavissa; Publish luo revision + PDF assetin.
- **Import ei “korvaa editoria”:** import tuottaa pohjadatan, jonka päälle editorissa tehdään täydennykset (kaapelit, laitteet, symbolit).
- **Symboli ≠ laite:** symbolit kiinnittyvät **liittimiin/terminaaleihin**; laite/kytkentäpaikka on kenttälaite-instanssi, jolla voi olla useita IO-kytkentöjä.

## Automaatiopalvelin-tyypit ja oletussivut
Keskuksella on `automation_server_type` (esim. `AS-P`, myöhemmin `AS-B`, jne).
- Kun tyyppi = **AS-P**, keskukseen luodaan oletuksena sivut:
  - **02 (PS)** ja **03 (AS-P)**, joiden **järjestys on lukittu**
  - sivujen sisältö on silti muokattavissa (malli/variantti voi vaihdella)
- Tulevaisuudessa tyyppien lisääminen (uudet palvelimet ja rakenteet) tehdään lisäämällä templaatit ja oletussivusäännöt.

## Kytkentäkuvakirja ja johdetut luettelot
Kytkentäkuvien muokkaus tuottaa tiedot, joiden pohjalta muodostetaan:
- kaapeliluettelo (kaapelit + parit/johdin + päät)
- laiteluettelo (kenttälaitteet + BOM/oheistuotteet)
- kilpiluettelo (toimitettavat laitteet: rivi1 tunnus, rivi2 kuvaus)

Katso tarkemmin: `docs/11_WIRING_EDITOR_VNEXT.md`, `docs/13_DERIVED_LISTS_AND_NAMEPLATES.md`, `docs/14_LAYOUT_EDITOR.md`.
