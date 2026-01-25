# Lessons learned (Teira DocumentManager) – living

Tämä dokumentti on **living**. Lisää sprintin päätteeksi 3–10 riviä: mikä meni pieleen, miksi, ja mitä tehdään seuraavassa sprintissä toisin.

## Sprint 2

### 1) Lint & type-safety

- **Älä käytä `any`** (eslint: `@typescript-eslint/no-explicit-any`). Suosi `unknown`, `Record<string, unknown>`, Prisma `JsonValue` + type guardit.
- Lisää sprintin aikana rutiini: **`npm run lint`** (ja `npm run typecheck`) ennen patch ZIP -toimitusta.

### 2) Next.js lint -deprekaatio

- `next lint` on merkitty deprecated: Next.js 16 poistaa sen.
- Backlog-toimenpide: migroi lintscriptti ESLint CLI:hin: `npx @next/codemod@canary next-lint-to-eslint-cli .` (ja päivitä package.json scripts).

### 3) Dependency-audit

- `npm audit` voi nostaa esiin transitiivisia haavoittuvuuksia (esim. `xlsx`).
- Backlog: seuraa upstream-fixiä / harkitse vaihtoehtoista kirjastoa jos fixiä ei tule. Samalla pyri rajaamaan parserointi palvelimelle ja validoimaan inputit.

### 4) Prisma client & typecheck järjestys

- Jos Prisma schema muuttuu, **`@prisma/client`-tyypit eivät päivity automaattisesti**.
- Opittu käytäntö: aja `npm run prisma:generate` ennen `npm run typecheck` (ja mieluiten myös ennen `npm run build`).
- Toteutettu: `package.json` skriptit ketjutettu niin, että `typecheck` ja `build` ajavat `prisma:generate` ensin.

### 5) Binary response bodies (XLSX/PDF)

- Kun palautetaan binääridataa route handlerista, TypeScript-tyypitys voi joissain ympäristöissä valittaa `Uint8Array`-body:stä.
- Turvallinen oletus: palauta `ArrayBuffer` (`u8.buffer.slice(...)`) tai `Blob`.

### 6) ExcelJS + Buffer / SharedArrayBuffer -tyyppimismatch

- Node `Buffer` on backed by `ArrayBufferLike` (voi olla `SharedArrayBuffer`). Joissain TS-ympäristöissä tämä aiheuttaa tyyppivirheitä ExcelJS:n `workbook.xlsx.load(...)`-kutsussa.
- Opittu käytäntö: tee **deterministinen kopio** bytesistä `new Uint8Array(len)` → käytä sen `.buffer` (aina `ArrayBuffer`) loadin inputtina.

### 7) MappingSpec vs todellinen lähdeformaatti

- Väärä `xml.root_array_path` tai väärä XML-formaattioletus näkyy heti UI:ssa `No items found at path ...`.
- Opittu käytäntö: ota **yksi oikea export-esimerkki** (kuten ObjectSet) sprintin alkuun ja varmista, että MappingSpec (`format: path` vs `format: objectset`) vastaa sitä.

## Sprint 2 — Lesson: XML declaration root handling
- fast-xml-parser can include the XML declaration as a `?xml` node, which prevents naive single-root unwrapping.
- MappingSpec XML paths are defined relative to the actual root element, so `unwrapSingleRoot()` must deterministically drop `?xml` when present.

- Kytkentäkuvissa on kriittistä lukita page model ajoissa: muuten editori ja PDF divergoivat.
