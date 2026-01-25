# Revision Workflow v2 — Draft vs Publish (lukittu)

## Tavoite
Revisiohallinnan pitää olla käyttäjän ohjaama ja selkeä:
- Käyttäjä voi tehdä useita Saveja ilman revisiokirjaimen kasvua.
- Publish luo revisioassetit (PDF, XML, XLSX jne.).
- Import-muutokset eivät tule voimaan “hiljaa”, vaan niistä ilmoitetaan ja käyttäjä hyväksyy.

## Revisioformaatti
- Rev-kirjain kasvaa: **A → B → ... → Z → AA → AB → ... → AZ → BA ...**
- Sama logiikka koskee kaikkia dokumenttityyppejä.

## Käsitteet
- **Draft**: muokattava tila (editor/taulukko), voi tallentua useita kertoja ilman revisiokirjaimen muutosta.
- **Revision**: käyttäjän hyväksymä, versionumerolla (rev) varustettu snapshot.
- **Publish**: tuottaa assetit (PDF, XML, XLSX, JSON snapshot) revisiolle.

## Lukittu käyttäjäpolku

### 1) Normaali muokkaus
1) Käyttäjä muokkaa (kytkentäkuva / työkirja / listat / layout).
2) **Save** tallentaa draftin (ei kasvata rev-kirjainta).
3) **Publish**:
   - jos draft ≠ viimeisin revision snapshot → luodaan uusi revisio (rev+1) ja siihen assetit
   - jos draft == viimeisin revision snapshot → voidaan generoida assetit uudelleen samaan revisioon (implementation choice), mutta UI ei saa kasvattaa rev-kirjainta ilman muutosta.

### 2) Import-muutokset (pending)
1) Importin jälkeen, jos pisteet muuttuvat: UI näyttää bannerin **"Import changes pending"**.
2) Käyttäjä näkee previewn ja hyväksyy muutokset.
3) Hyväksyntä tuottaa **uuden Revisionin** (rev kasvaa) ja ilmoittaa käyttäjälle (toast/modal).
4) Publish tuottaa assetit kyseiselle revisiolle.

Tämä ratkaisee kaksi vaatimusta:
- useita Saveja ilman rev-kasvua (normaalimuokkaus)
- importin hyväksyntä aiheuttaa "revisiopompun" (rev kasvaa), eikä muutokset jää “välitilaan”.

## Dokumenttikohtaisuus
- Jokaisella dokumentilla oma revisiohistoria per keskus:
  - (company_id, project_id, center_id/sub_center_id, docType)

## Assetit (lukittu)
Publish tuottaa vähintään:
- PDF
- JSON snapshot (editor state)
- XML export (kytkentäkuvat)
- XLSX export (jos myöhemmin otetaan käyttöön)

## UI
- Uudesta revisiosta ilmoitus käyttäjälle.
- Revisiolistaus dokumentin yhteydessä.
