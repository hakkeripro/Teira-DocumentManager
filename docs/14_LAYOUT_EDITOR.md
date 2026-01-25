# 14 – Layout Editor (Center Layout) v1.3

Layout-editori on keskuksen kaappisuunnittelu, jossa käyttäjä:
1) valitsee kaappirungon (esim. `SXWOS-2`)
2) raahaa moduulit ja oheislaitteet paikoilleen
3) näkee määrälaskennan/optioiden vaikutukset

## Yhteys kytkentäkuviin
- Layoutissa käytettävät moduulit perustuvat samoihin module templateihin kuin kytkentäkuvien sivut.
- Layout-komponentit linkitetään joko:
  - `wiring_page_id` (moduuli-instanssi) tai
  - `module_template_id` (jos sivua ei vielä ole luotu)

## Minimitoiminnallisuus (ensimmäinen versio)
- Kaappirungon valinta (taustakuva / SVG / canvas)
- Moduulin sijoitus (drag/drop, snap-to-grid)
- Komponenttien metadata (slot / paikka / label)
- Export: layoutin state JSONB (myöhempää renderöintiä varten)

> Varsinainen graafinen renderöinti ja laajempi komponenttikirjasto laajennetaan myöhemmin.


