# Import/Export Spec v1.3 – nykytila + merge-periaatteet

Tämä dokumentti kuvaa Sprint 2:n toteutuksen (UI + API + audit).
**Authoritative mapping** on aina: `docs/mapping/MappingSpec.yaml`.

## Tuetut kohteet (MappingSpec baseline)
Sprint 2 MVP tukee neljää dokumenttityyppiä (center-scoped):
- `DEVICE_LIST`
- `PULL_LIST`
- `TEST_LIST`
- `WIRING_DIAGRAMS`

Jokaiselle docTypelle MappingSpec määrittelee:
- **XLSX**: sheet-nimi, header-rivi, data-alkurivi sekä sarakeheaderit → canonical row_fields
- **XML**:
  - `format: path` (oletus): `root_array_path` sekä kenttäpolut (`fields.<key>.path`) → canonical row_fields
  - `format: objectset`: ObjectSet → module OI → point OI + PI (käytössä `WIRING_DIAGRAMS`)
- Validaatiot: required fields, unknown columns behavior, max rows, ym.

## XML formats (Mapping engine)

Mapping engine tukee kahta XML-mallia:

1) **Path-based** (`format: path`)
   - Käytetään kun XML on “normaali” hierarkkinen dokumentti, jossa rivit ovat yhden polun alla.
   - MappingSpec: `root_array_path` + `fields.<key>.path`.

2) **ObjectSet** (`format: objectset`)
   - Käytetään kun XML on IO-exportin tyyppinen ObjectSet.
   - MappingSpec: `module_array_path`, `point_array_key`, `module_fields`, `point_fields`.
   - PI:t talletetaan property bagiin (`properties.module_properties` / `properties.point_properties`) ja säilytetään exportissa.

## UI-reitit (SaaS, center-scoped)
- **Centers list**: `/app/projects/:projectId/centers`
- **Documents (center scoped)**: `/app/projects/:projectId/centers/:subCenterId/documents`
- **DocType detail (preview + revisions)**: `/app/projects/:projectId/centers/:subCenterId/documents/:docType`
- **Import / Export**: `/app/projects/:projectId/centers/:subCenterId/import`
- **Import runs (audit)**: `/app/projects/:projectId/centers/:subCenterId/imports`
- **Import run details**: `/app/projects/:projectId/centers/:subCenterId/imports/:jobId`

## Import flow (XLSX / XML)
> **Security note (npm audit):** XLSX-parsinta ja -tuotto käyttää **ExcelJS**-kirjastoa (ei SheetJS/xlsx), koska `xlsx`-paketilla on avoimia high-severity -haavoittuvuuksia ilman virallista korjausversiota.
1. Käyttäjä valitsee projektin + keskuksen (route-konteksti).
2. Käyttäjä valitsee `docType` ja lataa tiedoston (`.xlsx` tai `.xml`).
3. **Dry-run preview**:
   - Mapping engine tekee canonical-muunnoksen MappingSpecin mukaan
   - Lasketaan “wouldCreate / wouldUpdate” identity-avaimien perusteella
   - Näytetään issues (WARN/ERROR) + sample rows
4. **Commit import** (vain roolit WRITE/ADMIN):
   - Luodaan `import_job` (PENDING)
   - Tallennetaan `import_issue`-rivit (WARN/ERROR)
   - Jos ERROR → job FAILED
   - Muuten upsertataan canonical-rivit dokumentin `settings_jsonb.canonical` alle ja job SUCCESS

### Canonical tallennus (MVP)
Sprint 2:ssa canonical-data tallennetaan `document.settings_jsonb` alle:
```json
{
  "canonical": {
    "version": 1,
    "updatedAt": "2026-01-21T12:34:56.000Z",
    "docType": "DEVICE_LIST",
    "identityKeys": ["device_id"],
    "header": { "project_code": "PRJ", "center_code": "MAIN", "center_name": "Main" },
    "rows": [ { "device_id": "D-001", "name": "AHU-1", "properties": {...} } ]
  }
}
```

## Export flow (XLSX / XML)
- Export lukee canonical-rivit dokumentista ja tuottaa tiedoston MappingSpecin mukaan.
- MVP tuottaa tiedoston synkronisesti API-responsena (“proxy”).
  - Myöhemmissä sprinteissä voidaan siirtää job/asset -malliin (signed URL) ilman refaktorointia.

## API-endpointit
### Import dry-run
`POST /api/import/dry-run` (multipart/form-data)
- fields:
  - `projectId`
  - `subCenterId`
  - `docType`
  - `file` (`.xml` tai `.xlsx`)
- response: wouldCreate/wouldUpdate + issues + sampleRows

### Import commit
`POST /api/import/commit` (multipart/form-data, WRITE/ADMIN)
- fields kuten dry-run
- response: `jobId`, `documentId`, created/updated counts

### Export
`GET /api/export?projectId=...&subCenterId=...&docType=...&format=xlsx|xml`
- response: attachment download

### PDF download (revisions)
`GET /api/revisions/:revisionId/pdf`
- local: streamaa tiedoston
- supabase: redirect signed URL:iin

## Audit trail (ImportJob / ImportIssue)
Importista syntyy aina audit:
- `import_job`: kuka, milloin, mistä tiedostosta, mihin (project+center), status, summary_jsonb
- `import_issue`: WARN/ERROR, message, path

UI näyttää import runit ja yksityiskohdat.

## Tenant-scope
Kaikki import/export/audit-haut ovat aina `company_id`-scopessa.
Project/Center haetaan aina `company_id` perusteella ennen jatkoa.

## Unknown columns / property bag
MappingSpecin `unknown_columns_behavior` määrää, mitä tehdään tuntemattomille XLSX-sarakkeille:
- `ignore` → ohitetaan
- `warn` → tallennetaan `row.properties` + issue WARN
- `error` → tallennetaan `row.properties` + issue ERROR (estää commitin)

## Skaalautuvuus / job-queue (tulevat sprintit)
Toteutus on tehty niin, että voidaan lisätä async worker/job-queue:
- `import_job` on jo olemassa (status + summary)
- commit voidaan myöhemmin muuttaa: UI luo jobin, worker prosessoi, UI pollaa status

## Esimerkkiaineistot
Repo sisältää `examples/`-kansion:
- `TEIRA_Example_Import.xlsx`
- `DEVICE_LIST_example.xml`
- `PULL_LIST_example.xml`
- `WIRING_DIAGRAMS_ObjectSet_example.xml`

Katso `examples/README.md` nopeaan testaukseen.

---

## North Star: Import kytkentäkuvakirjaan (ei erillistä Import/Export-sivua UX:ssa)

### Perusperiaate
- Import tuottaa **pohjadatan** (canonical) tai “työkirjan” rivit.
- Editorissa käyttäjä täydentää:
  - kaapelointi (Kaapeli 1/2)
  - kytkentäpaikat
  - symbolit
  - laitevalinnat (ja BOM)

Import ei saa tuhota käyttäjän tekemiä editoritäydennyksiä.

### Merge-säännöt (tavoitetila)
Kun import ajetaan uudelleen samalle keskukselle + docTypelle:
1. **Sivut (wiring_pages)**:
   - olemassa olevat sivut säilyvät; uudet voidaan lisätä
   - lukitut sivut (02/03 AS-P-keskuksessa) säilyvät ja ovat aina olemassa
2. **Terminaalit (template)**:
   - template määrittää rivit; jos template muuttuu, sidonnat yritetään kohdistaa `terminal_code`-avaimen perusteella
3. **Editor-sidonnat** (symbolit, kaapelit, laitteet):
   - säilytetään, jos `terminal_code` löytyy edelleen
   - jos `terminal_code` poistuu/ei löydy → sidonta merkitään “orvoksi” ja näytetään UI:ssa korjattavaksi
4. **Pisteet/työkirja**:
   - copy/paste-tyylinen bulk-syöttö on ensisijainen tapa muokata IO-pointteja
   - import voi päivittää “point-faktat” (nimi/kuvaus/tyyppi), mutta ei kaapelointeja eikä laitevalintoja ilman käyttäjän hyväksyntää

### Kaapeli 1 / Kaapeli 2 -tulkinta importissa
Import ei aseta kaapeleita automaattisesti, ellei mapping sisällä niitä.
Kun kaapeleita tuodaan/luodaan:
- suora kenttälaite→moduuli: täytetään **Kaapeli 1**
- jos mapping kertoo välikytkennän: Kaapeli 1 = sisäinen segmentti, Kaapeli 2 = kenttäsegmentti


