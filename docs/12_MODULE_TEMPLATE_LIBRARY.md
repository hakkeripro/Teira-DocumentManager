# 12 — Module Template Library v2 (connector lines / print parity)

Tämä dokumentti lukitsee moduulitemplatet kytkentäkuvien print-pariteettia varten.

## Perusmalli (lukittu)

Yksi kytkentäkuvan **print-rivi** vastaa yhtä IO-kanavaa (terminal_code).
Print-rivillä on:
- `terminal_code` (bindauksen avain; esim. `DI1`, `DO8`, `UI16`)
- `connector_lines[]` (Liitin-soluun pinottavat rivit; *tulosteen pariteetti*)
- `order_index`

Tärkeää:
- Kaapelit/destination/laitteet bindataan `terminal_codeen`.
- `connector_lines` ovat visuaalisia “stacked labels” -riviä samassa solussa.

## Referenssit
- UI-kuvat: `docs/ui_refs/wiring_editor_v2/*`
- PDF: `docs/golden/kytkentäkuva.pdf`

## DI-16 (Digital Input 16)
Referenssi: `Kytkentakuva_DI16.png`

Connector lines per kanava (esimerkki DI1):
- `DI1 / 1`
- `RET / 2`
- `G`
- `G0`

RET-jaot (lukittu): DI1+DI2 jakaa RET/2, DI3+DI4 jakaa RET/5, jne.

## UI-16 (Universal Input 16)
Sama logiikka kuin DI-16 (UIx/.. + RET/.. + G + G0).

## AO-V-8 (Analog Output 8)
Sama logiikka: AOx/.. + RET/.. + G + G0 (pariteetti referenssiin).

## DO-FA-12 ja DO-FA-12-H (Digital Output 12)
Referenssi: `Kytkentakuva_DO-FA.png`

Connector lines per DO-kanava (lukittu pattern):
- `DOx NO / n`
- `DOx C / (n+1)`
- `G`
- `G0`

Huom: referenssin mukaan G/G0 näkyvät jokaisen DO-kanavan yhteydessä (tulosteen pariteetti).

## AS-P (Automaatiopalvelin)
Referenssi: `Kytkentakuva_AS-P.png`

AS-P sivu on lukittu (default page 02). Liitin-solun rivit sisältävät vähintään:
- Ethernet
- RS-485
- LON

AS-P:n tarkka `terminal_code`-skeema voidaan jättää open-itemiksi (jos referenssi ei riitä), mutta `connector_lines`-tuloste tulee toteuttaa pariteetilla.

## PS (Tehonlähde)
PS on oletussivu AS-P-keskuksessa (page 01, locked).
Käyttäjä voi lisätä lisää PS-sivuja myöhemmin vapaasti.
