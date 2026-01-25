# Data Model v1.3 (Postgres) – nykytila + vNext

Tämä on MVP-tietomalli. Kaikki taulut ovat `company_id`-scopessa (multi-tenant).
Tuotannossa DB on managed Postgres (+ connection pooling).

## Tenant & access
- `company(id, name, created_at)`
- `user(id, company_id, email, name, role, created_at)` (auth providerin user_id voidaan tallentaa)

## Organisointi
- `area(id, company_id, name, sort_order)`
- `project(id, company_id, area_id, name, code, customer_name?, site_name?, site_address?, status, created_at)`

## Keskukset / alakeskukset (Project-level)
- `sub_center(id, company_id, project_id, name, code?, sort_order, created_at)`

**Tarkoitus:** samaan projektiin voi kuulua useita keskuksia, ja dokumentit/revisiot ovat keskuskohtaisia.

**Migration (Sprint 2):**
- jokaiselle projektille luodaan automaattisesti “Default/Main” sub_center
- olemassa olevat projektitasoiset dokumentit siirretään tähän sub_centeriin

## Kirjastot (company-level)
- `module_template(id, company_id, code, external_xml_type, kind...on, default_channel_pi_name, default_channel_prefix, is_active)`
- `module_template_terminal(id, module_template_id, channel_no?, terminal_code, terminal_label, row_order, is_connectable)`
...
- `point_wiring_group(point_id pk, wiring_group_id, role?)`
- `project_cable(id, project_id, cable_no, cable_type_id?, from_...tion?, to_location?, install_route?, termination_place?, notes)`
- `point_cable_term(id, point_id, cable_slot(PRIMARY|SECONDARY), pair_no?, conductor?, shield?, override_cable_id?)`

## Symbolit (liittimeen kiinnitetty)
- `symbol_instance(id, project_id, symbol_definition_id, module_..._id, channel_no?, terminal_code, point_id?, label?, sort_order)`

## Dokumentit ja revisiot (keskuskohtaiset)
- `document(id, company_id, project_id, sub_center_id, type(enum), title, settings_jsonb, updated_at)`
- `document_revision(id, company_id, document_id, rev_letter(char1), created_at, created_by_user_id, change_note)`
- `document_revision_asset(id, company_id, document_revision_id, asset_type(PDF|JSON_SNAPSHOT|XML_EXPORT), storage_provider, storage_key, created_at)`

**Uniikkius (tavoite):**
- yksi dokumentti per `sub_center_id + type` (eli jokaisella keskuksella oma kytkentäkuva/testauslista/vetoluettelo/laiteluettelo)

> Implementation note (Sprint 1): `document` on vielä projektitasolla (`project_id + type`). Tämä muuttuu Sprint 2:ssa.

## Import audit (keskus-aware)
- `import_job(id, company_id, project_id, sub_center_id?, source(XML|XLSX), filename, created_by, created_at, status, summary_jsonb)`
- `import_issue(id, company_id, import_job_id, severity(WARN|ERROR), message, path)`

Käytännössä import kohdistetaan aina johonkin keskukseen (UI valinta). `sub_center_id` voidaan tehdä pakolliseksi Sprint 2:ssa, ja legacy-tapauksissa käytetään “Default/Main” -keskusta.

---

## vNext: Kytkentäkuvakirja (page model) + kirjastot

Tässä kuvataan tavoitetilan laajennukset. Nämä eivät ole vielä välttämättä toteutettu DB:ssä, mutta ne ohjaavat seuraavia sprinttejä ja migraatioita.

### Center: automaatiopalvelin-tyyppi
`sub_centers`
- `automation_server_type` (esim. `AS-P`, myöhemmin `AS-B`, jne)
- default-sivut ja lukitukset määräytyvät tämän perusteella.

### Module templates (pohjat)
`module_templates`
- `id`, `company_id`
- `template_key` (esim. `DI-16`, `UI-16`, `AO-V-8`, `DO-FA-12-H`, `AS-P`, `PS-24V`)
- `description`
- `is_system` (true = järjestelmän toimittama pohja)

`module_template_terminals`
- `id`, `company_id`, `template_id`
- `terminal_code` (ankkuri, esim. `DI1`, `RET_2`, `G`, `G0`, `DO8_NO`, jne)
- `print_label` (täsmälleen tulosteen teksti, esim. `DO8 NO / 15`)
- `order_index`
- `group_key` (valinnainen; esim. DI-kanava + RET + G + G0 samaan lohkoon)

### Wiring pages (moduulisivut)
`wiring_pages`
- `id`, `company_id`, `project_id`, `sub_center_id`
- `page_code` (esim. `02`, `03`, `14`)
- `page_name` (esim. `PS`, `AS-P`, `DO-FA-12-H`)
- `template_id`
- `order_index`
- `is_order_locked` (true esim. 02/03 AS-P -keskuksessa)

### Wiring editor state (kytkentäkuvan muokattavat tiedot)
`wiring_terminal_bindings`
- `id`, `company_id`, `wiring_page_id`
- `terminal_code`
- `symbol_instance` (JSONB: type + label/params; alkuun ikoni + teksti)
- `cable_1` (JSONB: cable_id, type/size, pair_or_conductor, free_text)
- `cable_2` (JSONB: kuten yllä)
- `destination` (JSONB: kytkentäpaikka, liitin, minne johdetaan, välkytkentäpaikka)
- `status` (JSONB: kytketty/tarkastettu yms – myöhemmin)

### Device catalog + device instances (laitekirjasto ja kenttälaitteet)
`device_catalog_items`
- `id`, `company_id`
- `device_type` (esim. taajuusmuuttaja, vesianturi)
- `manufacturer`, `model`, `product_code` (valinnainen)
- `default_cable` (valinnainen; viite tai teksti)
- `supplied_by_us_default` (boolean)

`device_catalog_bom_rows`
- `id`, `company_id`, `catalog_item_id`
- `product_code`, `description`, `qty_default`
- `is_optional`, `option_group_key` (esim. anturitasku)

`device_instances`
- `id`, `company_id`, `project_id`, `sub_center_id`
- `tag` (tunnus), `description_lines` (JSONB array)
- `catalog_item_id` (valinnainen; laite voi olla “ei meidän toimitus”)
- `supplied_by_us` (boolean; vaikuttaa kilpiluetteloon)
- `selected_options` (JSONB: valitut BOM-rivit)

`device_terminal_links`
- `id`, `company_id`
- `device_instance_id`, `wiring_page_id`, `terminal_code`
- `role` (esim. ohjaus/ind/halytys/säätöviesti; erityisesti VFD-tyyppiset)

### Nameplates (kilpiluettelo)
`nameplate_entries`
- `id`, `company_id`, `project_id`, `sub_center_id`
- `row1` (default: laitteen tunnus)
- `row2` (default: laitteen kuvaus)
- `order_index`

### Center layout (graafinen)
`center_layouts`
- `id`, `company_id`, `project_id`, `sub_center_id`
- `cabinet_template_key` (esim. `SXWOS-2`)
- `canvas_state` (JSONB; sijoittelu)

`layout_components`
- `id`, `company_id`, `layout_id`
- `component_type` (module, accessory, terminal_block, duct, din_rail, jne)
- `ref_id` (wiring_page_id / module_template_id / catalog_item_id)
- `position` (JSONB: x,y,w,h,rotation)

> Layoutin yksityiskohdat tarkennetaan erillisessä speksissä (katso `docs/14_LAYOUT_EDITOR.md`).


