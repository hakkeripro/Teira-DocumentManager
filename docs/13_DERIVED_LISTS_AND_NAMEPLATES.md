# 13 — Derived Lists & Nameplates v2 (v1 toteutuslukitukset)

Tässä määritellään johdetut listat ja niiden merge/override -politiikka.

## Lähdedata
Derived v1 käyttää ensisijaisesti:
- WIRING_DIAGRAMS editor state (terminaali-bindaus: laite, kaapelit, destination)
- Canonical rows (Työkirja-tabin pisteet)

Tavoite: johdetut listat toimivat ilman täydellistä device catalogia.

## Yhteiset merge-säännöt (lukittu)
- Case-sensitive tunnukset (TE1 != te1)
- Tyhjät tunnukset kerätään “Unnamed” -listaan (ei estä käyttöä)
- Johdettu data + käyttäjän override:
  - järjestelmä laskee “derived ehdotuksen”
  - käyttäjä voi override-muokata
  - UI näyttää poikkeaman johdetusta
  - UI tarjoaa “Reset to derived”

## Laiteluettelo (v1)

### Sarakkeet (minimi)
- **Koodi** (identity key; avain = koodi)
- **Valmistaja**
- **Määrä** (derived, mutta muokattava)
- (suositus) **Kuvaus** (vapaa teksti)
- (v1) **Toimituksessa** (boolean; default true)

### Derivointi
- Koodi/valmistaja/kuvaus johdetaan kytkentäkuvien ja laitevalintojen perusteella (tai käyttäjä syöttää).
- Määrä lasketaan johdetusti, mutta käyttäjä voi override-muokata.

### Kilpien suhde
- Kilpiluettelo johdetaan laiteluettelosta niille riveille, joilla `Toimituksessa = true`.

## Kaapeliluettelo (v1)

### Sarakkeet (lukittu minimi)
- **Tunnus**
- **Tyyppi**
- **Mistä**
- **Mihin**
- **Vedetty** (checkbox)
- **Kommentti**

Lisäksi:
- Manuaalinen override-indikaattori (ikoni + hover “Manuaalinen override”).

### Derivointi ja ryhmittely
- Kaapelit johdetaan WIRING:n Kaapeli-kentistä.
- Ryhmittelysääntö on regex/konfiguroitava.
  - Oletus: yhteinen runko ennen viimeistä `_` (esim. `TK01-SC01` on runko; `_K` ja `_T` saman kaapelin päätteitä).
  - Jos tunnuksessa ei ole erotinta → ei automaattiryhmittelyä.

### Multi-IO laitteet
- Laitteilla (esim. taajuusmuuttaja) voi olla useita IO:ta.
- Laitevalinnassa voidaan valita samaan laitteeseen kuuluvat pisteet → näille luodaan yhteinen kaapeli.

## Kilpiluettelo (Nameplates) (v1)

### Muoto
- 2-rivinen:
  - Rivi 1: tunnus
  - Rivi 2: kuvaus

### Sisältö
- Kilvet toimitetaan niille laitteille, jotka ovat "toimituksessa".
- Lista on johdettu, mutta muokattava (override).
