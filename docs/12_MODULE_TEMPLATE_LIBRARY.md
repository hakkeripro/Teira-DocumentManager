# 12 – Module Template Library v1.3

Tämä dokumentti listaa minimissä tarvittavat moduulipohjat ja niiden liitintiedot.
Lähteet: käyttäjän toimittamat Excelit (liitintiedot).

## Template-malli (print-rivit + connector lines)

Referenssitulosteissa yksi taulukon rivi vastaa **yhtä IO-kanavaa / pistettä**, mutta **Liitin**-sarakkeessa
on usein useita "liitinrivejä" (stacked labels) samassa solussa.

Siksi moduulitemplate mallinnetaan **print-riveinä**, joilla on:

- `terminal_code` (data-bindauksen avain; esim. `DI1`, `DO8`, `UI16`)
- `connector_lines[]` (näyttöön tulevat rivit *samassa solussa*; esim. `["DI1 / 1", "RET / 2", "G", "G0"]`)
- `order_index` (rivien järjestys sivulla)
- (optio) `group` (esim. DI-16: RET-jaot / ryhmittely)

Käyttö editorissa:
- **Print-grid** näyttää `connector_lines` pinottuina Liitin-solussa.
- Käyttäjän muokkaama data (tunnus/teksti, kaapelit, destination) sidotaan `terminal_code`:en (ei yksittäisiin connector_line-riveihin).

Huom: jos myöhemmin tarvitaan fyysisen rivin tasoista validointia, lisätään erillinen `physical_terminal_code`,
mutta UI-kontrakti pysyy: yksi print-rivi = yksi IO.


## DI-16 (Digital Input 16)
Liitintiedot (print_label):
- DI1 / 1
- RET / 2
- G
- G0
- DI2 / 3
- DI3 / 4
- RET / 5
- DI4 / 6
- DI5 / 7
- RET / 8
- DI6 / 9
- DI7 / 10
- RET / 11
- DI8 / 12
- DI9 / 13
- RET / 14
- DI10 / 15
- DI11 / 16
- RET / 17
- DI12 / 18
- DI13 / 19
- RET / 20
- DI14 / 21
- DI15 / 22
- RET / 23
- DI16 / 24

Huom: RET jaot (vahvistettu): DI1+DI2 jakaa RET/2, DI3+DI4 jakaa RET/5, jne.

## UI-16 (Universal Input 16)
Liitintiedot:
- UI1 / 1
- RET / 2
- G
- G0
- UI2 / 3
- UI3 / 4
- RET / 5
- UI4 / 6
- UI5 / 7
- RET / 8
- UI6 / 9
- UI7 / 10
- RET / 11
- UI8 / 12
- UI9 / 13
- RET / 14
- UI10 / 15
- UI11 / 16
- RET / 17
- UI12 / 18
- UI13 / 19
- RET / 20
- UI14 / 21
- UI15 / 22
- RET / 23
- UI16 / 24

## AO-V-8 (Analog Output 8)
Liitintiedot:
- AO1 / 1
- RET / 2
- G
- G0
- AO2 / 4
- RET / 5
- AO3 / 7
- RET / 8
- AO4 / 10
- RET / 11
- AO5 / 13
- RET / 14
- AO6 / 16
- RET / 17
- AO7 / 19
- RET / 20
- AO8 / 22
- RET / 23

## DO-FA-12 ja DO-FA-12-H (Digital Output 12)
Referenssi: `docs/ui_refs/wiring_editor_v2/Kytkentakuva_DO-FA.png`

Liitintiedot (samat):
Huom: referenssitulosteessa jokaisen DO-kanavan jälkeen näkyy kaksi lisäriviä (G ja G0). Toteutuksessa template voi mallintaa nämä rivit (G/G0 per kanava) jotta UI==tuloste.

- DO1 NO / 1
- DO1 C / 2
- G
- G0
- DO2 NO / 3
- DO2 C / 4
- DO3 NO / 5
- DO3 C / 6
- DO4 NO / 7
- DO4 C / 8
- DO5 NO / 9
- DO5 C / 10
- DO6 NO / 11
- DO6 C / 12
- DO7 NO / 13
- DO7 C / 14
- DO8 NO / 15
- DO8 C / 16
- DO9 NO / 17
- DO9 C / 18
- DO10 NO / 19
- DO10 C / 20
- DO11 NO / 21
- DO11 C / 22
- DO12 NO / 23
- DO12 C / 24

## AS-P (Automaatiopalvelin)
Referenssi: `docs/ui_refs/wiring_editor_v2/Kytkentakuva_AS-P.png`

Liitintiedot (print_label) minimitasolla (järjestys kuvasta):
- Ethernet 1 / RJ-45
- Ethernet 2 / RJ-45
- TX/RX+ / 1
- TX/RX- / 2
- RET / 3
- Bias+ / 4
- TX/RX+ / 1 (2. väylä)
- TX/RX- / 2 (2. väylä)
- RET / 3 (2. väylä)
- Bias+ / 4 (2. väylä)
- TX/RX+ / 5
- TX/RX- / 6
- RET / 7
- TX/RX+ / 5 (2. kanava)
- TX/RX- / 6 (2. kanava)
- RET / 7 (2. kanava)
- LON-1 / 11
- LON-2 / 12
- LON-1 / 11 (2. kanava)
- LON-2 / 12 (2. kanava)

Huom: yllä oleva lista on “print_label”-tasoinen; jos tarvitaan tarkempi terminal_code -malli, lukitaan se Sprint 5 UI-työssä.

## PS (Tehonlähde)
PS on tehonlähdesivu (oletuksena AS-P-keskuksessa sivu 01), mutta järjestelmään tulee myöhemmin tuki useille PS-instansseille myös IO-moduulien välissä.


