# Import/Export Spec v2 — kytkentäkuvat (WIRING) + UX

Tämä dokumentti lukitsee Import/Export -periaatteet vastaamaan nykyistä tavoitetta.

## Periaate (lukittu)

1) **Vain kytkentäkuvat** (`WIRING_DIAGRAMS`) tarvitsevat tiedostomuotoisen exportin.
- Export muoto: **XML** (ObjectSet/IO Export -tyyppinen)

2) Muut dokumentit:
- Export = copy/paste taulukosta (ei tiedosto-exportia v1:ssä)

3) Ei erillistä Import/Export-sivua kytkentäkuville.
- Import/Export toiminnot ovat **kytkentäkuvaeditorissa** (Kytkentäkuva + Työkirja -tabit).

## Golden fixture: IO Export XML

Kytkentäkuvien XML exportin tulee olla rakenteeltaan ja kentiltään yhteensopiva mallin kanssa:
- `docs/golden/IO_Export_Malli.xml`

Vaatimus (lukittu):
- Export sisältää **samat kentät kuin import** ("ohjelmasta tuodussa importissa").
- Export **ei sisällä** PS/AS-P -sivuja.

## Import (WIRING)

### Yleistä
- Import kohdistuu aina yhteen keskukseen + WIRING_DIAGRAMS -dokumenttiin.
- Import ei saa ylikirjoittaa käyttäjän kaapelointeja eikä laitevalintoja.

### Validointi (lukittu)
- Jos moduulit eivät täsmää nykyiseen kytkentäkuvakirjaan → **error** ja import estetään.
- Jos pisteet (point data) muuttuvat:
  - UI näyttää bannerin: **"Import changes pending"**
  - Käyttäjälle näytetään muutoslista (preview)
  - Hyväksyntä luo revision (ks. `04_REVISION_WORKFLOW.md`)

## Export (WIRING)

### Mitä exportaa
- Export sisältää IO-moduulien ja pisteiden tiedot golden-mallin mukaisesti.
- Export ei sisällä PS/AS-P -sivuja.

### Milloin exportaa
- Export voidaan tehdä editorista (Kytkentäkuva/ Työkirja).
- Export on deterministinen ja perustuu viimeisimpään **julkaistuun** revisioon (tai käyttäjän valitsemaan revisioon).

## UX: missä Import/Export sijaitsee

- Kytkentäkuva-tabissa on Import/Export -toiminnot.
- Työkirja-tabissa on samat Import/Export -toiminnot.
- Erillistä Import/Export -reittiä ei käytetä WIRING:ille.

## Toteutushuomio (cursor/ai)

Repo voi sisältää historiallisia import/export -endpointeja muille docTypeille.
V1 UX:ssa niitä ei nosteta esiin, ellei käyttäjä erikseen vaadi.
