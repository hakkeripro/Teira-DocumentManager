# 13 – Derived Lists & Nameplates v1.4

Tässä määritellään, miten kytkentäkuvien tiedoista johdetaan luettelot.

Tavoite: Sprint 5 toteuttaa **Derived Lists v1** ilman, että koko laitekirjasto/BOM on vielä valmis.
Myöhemmissä sprinteissä luettelot rikastetaan device catalogilla ja BOM-riveillä (OI-006).

## Lähdedata (v1)

Derived Lists v1 käyttää ensisijaisesti:

- WIRING_DIAGRAMS editor v2 state (terminaali-/print-rivi sidonnat: tunnus/teksti, Kaapeli 1/2, destination)
- Canonical rows (Työkirja-tabin kautta muokattava bulk-data; name/description/module/channel)

Johdannassa käytetään **tunnuksia ja kuvauksia**, ei täydellistä BOM-kirjastoa.

## Laiteluettelo (v1)

V1 laiteluettelo on **2-sarakkeinen muokattava lista** toimitettavista laitteista (minimitaso):

- **Tunnus** (default: editorin kenttälaite/tunnus)
- **Kuvaus** (default: editorin teksti/kuvaus)

Lisähuomiot:
- V1: lista on "derived + editable": järjestelmä ehdottaa rivejä, käyttäjä voi muokata.
- V2+: kun device catalog + supplied_by_us -logiikka on lukittu, laiteluetteloa rikastetaan automaattisesti.

## Kaapeliluettelo (v1)

Kaapeliluettelo muodostetaan kytkentäkuvien kaapelikentistä:

- Kaapeli 1 ja Kaapeli 2 voivat olla eri segmenttejä.
- Sama kaapelitunnus voi esiintyä usealla print-rivillä (multi-IO / multi-drop).

V1 minimikentät (per kaapeli):
- kaapelitunnus
- kaapelityyppi/koko (jos syötetty)
- päät (mistä → minne) koottuna print-riveistä

## Kilpiluettelo (Nameplates) (v1)

Kilpiluettelo on 2-sarakkeinen muokattava lista toimitettaville laitteille.

V1 oletus:
- **Rivi 1:** laitteen tunnus
- **Rivi 2:** laitteen kuvaus

Käyttäjä voi muokata listaa (järjestys ja tekstit).

### UX ja merge-policy (toteutus Sprint 5)

- Päänäkymä näyttää **vain näkyvät rivit**:
  - johdetut (derived) rivit ensin
  - manuaaliset rivit perässä (ja jos manuaalinen rivi käyttää samaa tunnusta kuin johdettu, se **korvaa** johdetun rivin samassa paikassa)
- Johdetun rivin **tunnus on lukittu**, mutta kuvausta voi muokata (tallentuu overrideksi).
- Johdetun rivin voi **Exclude**-toiminnolla piilottaa. Piilotetut johdetut rivit näkyvät erillisessä "Excluded derived rows" -osiossa, josta ne voi palauttaa.
- Manuaalisia rivejä voi lisätä ja poistaa.
- Tallennus ei muokkaa WIRING_DIAGRAMS:ia; kilpiluettelo tallentaa omat override- ja manuaalirivinsä sekä päivittää canonical rows -aineiston exportia varten.

## Avoimet päätökset

- Derive-säännöt (duplikaatit, case-sensitiivisyys, tyhjät tunnukset, käsin lisätyt rivit) ovat OI-008:ssa.
- Device catalog + BOM tulee OI-006:n kautta.
