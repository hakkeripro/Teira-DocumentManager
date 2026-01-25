# Revision Workflow v1.3 (Teira DocumentManager)

## Draft vs Publish
- Draft: muokattava taulukko/tila (ei PDF:tä pakollisesti).
- Publish: luo `document_revision` ja generoi PDF assetin.

## Revisioformaatti
- Näytettävä rev: `{rev_letter}-{project.code}` (esim. `A-XXX`)
- Rev-kirjain kasvaa A→B→…→Z
- MVP: Z:n jälkeen estetään publish tai sovitaan AA myöhemmin.

## Dokumenttikohtaisuus (keskuskohtainen)
- Jokaisella dokumentilla oma revisiohistoria **per keskus**:
  - Kytkentäkuvat
  - Testauslista
  - Vetoluettelo
  - Laiteluettelo

Tarkennus: revisiohistoria kasvaa per **(sub_center + document type)**. 
Sama rev-merkintä `{rev_letter}-{project.code}` on yksiselitteinen keskuksen kontekstissa (UI näyttää keskuksen nimen/koodin erikseen).

## PDF-tiedostonimi (suositus)
PDF/Export assettien tiedostonimeen kannattaa lisätä myös keskuksen koodi/nimi, esim:
- `{docType}-{rev}-{project.code}-{subCenter.code}.pdf`

Tämä helpottaa, kun samassa projektissa on useita keskuksia.


## PDF download (API)
- `GET /api/revisions/:revisionId/pdf`
  - Local storage: streamaa PDF:n
  - Supabase storage: redirect signed URL:iin

UI tarjoaa linkin revision riviltä sekä docType-sivulta.

## Huomio kytkentäkuviin
Kytkentäkuvissa Publish/PDF renderöinti perustuu tavoitetilassa **page modeliin**, jossa editori on sama kuin tuloste.
