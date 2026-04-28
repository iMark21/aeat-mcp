# AEAT MCP — Backlog

Context: [CONTEXT.md](CONTEXT.md)
Prefix: `MCP`

> Revised 2026-03-20 by Fiscal Service + Product Owner.
> Rationale for changes documented after each phase.

---

## Guiding Principles (from review)

### REGLA FUNDAMENTAL: Solo fuentes oficiales

**PROHIBIDO** usar datos de blogs, consultoras, gestorías, medios de comunicación u otras fuentes no oficiales. Todo dato debe proceder EXCLUSIVAMENTE de:

1. **AEAT** (sede.agenciatributaria.gob.es) — manuales prácticos, instrucciones, simuladores
2. **BOE** (boe.es) — legislación consolidada (leyes, reales decretos, órdenes)
3. **Boletines oficiales autonómicos** (BOJA, BOCM, DOGC, etc.) — para normativa CCAA
4. **Diputaciones Forales** — para territorios forales (Bizkaia, Gipuzkoa, Álava, Navarra)
5. **Seguridad Social** (seg-social.es) — para cotizaciones RETA y régimen general
6. **Ministerio del Interior** — para algoritmo de validación NIF/NIE

Cada dato en los JSON DEBE incluir:
- `source`: referencia exacta (ley, artículo, BOE-A-XXXX-XXXXX)
- `verified_date`: fecha de última verificación

Si un dato no tiene fuente oficial verificable, NO se incluye. Preferible un campo vacío a un dato sin fuente.

### Naming: English tool names, Spanish data identifiers

- **Tool names in English** (`get_irpf_brackets`, not `obtener_tramos_irpf`). MCP tools are called by AI agents worldwide; English maximizes discoverability and interoperability. The data itself is inherently Spanish (IRPF, IVA, CCAA names) and stays in Spanish where it is a proper noun or legal term.
- **Resource URIs use `tax-es://`** instead of `aeat://`. Rationale: `aeat://` implies official agency endorsement (which we do not have). `tax-es://` is descriptive ("tax data for Spain"), avoids trademark risk, and follows the MCP convention that URIs should be self-documenting. Format: `tax-es://irpf/2025/brackets`, `tax-es://iva/2025/rates`.
- **Prompt names in English** with Spanish fiscal terms where needed: `analyze_tax_situation`, `autonomo_quarterly_checklist`.

### MCP best practices applied

- Every tool gets a human-readable description written for LLMs (no jargon, explain what the tool returns and when to use it).
- Errors returned inside the result object (not protocol-level), with category + message + suggestion.
- Input validation via Zod with helpful error messages ("year must be 2015-2026, got 2030").
- Each data point carries `source` (law/article/BOE) and `verified` (date) fields in the JSON.

---

## Phase 1 — MVP "Tax Reference Data" (target: v0.1.0)

Goal: Ship the **6 most-demanded reference lookups** that any AI agent advising on Spanish taxes would need. No calculations, just verified data. Fast to build, fast to verify, immediately useful.

| ID | Task | Est | Depends | Notes |
|----|------|-----|---------|-------|
| MCP-01 | Scaffolding: repo, TypeScript, MCP SDK, Zod, vitest, eslint, tsconfig | S | — | stdio transport. Structure: `src/tools/`, `src/resources/`, `src/data/`, `src/prompts/`. Use `@modelcontextprotocol/sdk` |
| MCP-02 | Data: IVA rates 2024-2025 (general, reducido, superreducido, recargo equivalencia, IGIC, IPSI) | S | MCP-01 | Already VERIFIED in knowledge base. Include Canary Islands IGIC + Ceuta/Melilla IPSI. Easiest domain to start with |
| MCP-03 | Data: IRPF state brackets 2024-2025 (base general + ahorro) | S | MCP-01 | 6 brackets general (art. 63), 5 brackets ahorro (art. 66). 2025 ahorro change: top bracket 14%->15% (Ley 7/2024). Requires verification against Manual Renta 2025 |
| MCP-04 | Data: personal/family minimums 2024-2025 | S | MCP-01 | Arts. 57-61 Ley 35/2006. Taxpayer, descendants, ascendants, disability. Stable data (unchanged since 2015) |
| MCP-05 | Data: economic indicators 2024-2026 (IPREM, SMI, legal interest rate) | S | MCP-01 | IPREM: 600 EUR/month (frozen since 2023). SMI 2025: 1.184 EUR/month, 2026: 1.221 EUR/month. Source: RD + BOE |
| MCP-06 | Data: fiscal calendar 2026 (AEAT deadlines by quarter) | S | MCP-01 | JSON from AEAT calendario contribuyente. High utility — agents answering "when do I file X?" |
| MCP-07 | Data: tax form catalog (modelos 100, 130, 303, 390, 720, 721, 347, 349, 200) | S | MCP-01 | Name, periodicity, deadline, description, who files it. Expand from current [PENDING] catalog |
| MCP-08 | Tool: `get_vat_rates(year, territory?)` | S | MCP-02 | Returns IVA rates. Optional territory param for IGIC/IPSI (default: peninsular Spain) |
| MCP-09 | Tool: `get_irpf_brackets(year, type?)` | S | MCP-03 | type: "general" (default) or "savings". Returns state-level brackets only in Phase 1 |
| MCP-10 | Tool: `get_personal_minimums(year)` | S | MCP-04 | Returns personal, descendants, ascendants, disability minimums |
| MCP-11 | Tool: `get_indicators(year, indicator?)` | S | MCP-05 | IPREM, SMI, legal interest rate. Optional filter by indicator name |
| MCP-12 | Tool: `get_fiscal_calendar(year, quarter?, modelo?)` | S | MCP-06 | Filter by quarter and/or modelo. Returns deadlines with descriptions |
| MCP-13 | Tool: `get_tax_form_info(modelo)` | S | MCP-07 | Info from catalog: name, periodicity, deadline, who files, description |
| MCP-14 | Tool: `validate_tax_id(id)` | S | MCP-01 | Validates NIF (mod 23 letter), NIE (X/Y/Z prefix + mod 23), CIF (control digit/letter). Returns: valid/invalid, type (NIF/NIE/CIF), formatted value. High utility, zero regulatory risk, well-documented algorithm (Ministerio del Interior) |
| MCP-15 | Resource: `tax-es://irpf/{year}` | S | MCP-03, MCP-04 | Complete IRPF reference for a year (brackets + minimums). Read-only data resource |
| MCP-16 | Resource: `tax-es://iva/{year}` | S | MCP-02 | Complete IVA reference (rates + surcharges + IGIC/IPSI) |
| MCP-17 | Resource: `tax-es://calendar/{year}` | S | MCP-06 | Full fiscal calendar |
| MCP-18 | Tests: 1+ test per tool with verified expected values | M | MCP-08..MCP-14 | vitest. Each test validates output against official source. Include edge cases (year out of range, invalid NIF, territory not found) |
| MCP-19 | README.md + LICENSE (MIT) + CONTRIBUTING.md + legal disclaimer | S | MCP-01 | Installation, Claude Desktop config, usage examples, disclaimer: "informational only, not tax advice" |
| MCP-20 | Publish to npm + create GitHub repo (public) | S | MCP-18, MCP-19 | `npx aeat-mcp` or manual config in `claude_desktop_config.json`. Semantic versioning |

### Phase 1 rationale

**Added vs. original:**
- `validate_tax_id` (MCP-14): New. High-demand utility (every gestor/agent needs NIF validation). Zero data curation — purely algorithmic. Adds immediate practical value to the MVP.
- Territory parameter on `get_vat_rates`: Canary Islands (IGIC) and Ceuta/Melilla (IPSI) are distinct indirect tax systems, not IVA. An IVA-only tool would give wrong answers for 2.2M Spanish residents.
- Resources (MCP-15..17): Were in Phase 2, moved up. Resources are trivial once the data exists — they are just read-only views of the same JSON.

**Removed/changed:**
- Merged original MCP-27 (resources) into Phase 1. No reason to delay when data layer already exists.
- Reordered: data tasks before tool tasks (data must be verified before tools expose it).

**Effort assessment:** All items are S except tests (M) because they require manual cross-checking against official sources. Total: ~18 S-size + 1 M-size. Achievable in 2-3 focused sessions.

**Data verification order (easiest to hardest):**
1. IVA — already VERIFIED in knowledge base
2. Economic indicators — simple BOE lookups, few values
3. Tax form catalog — AEAT website, stable data
4. Fiscal calendar — AEAT publishes annually, structured
5. Personal minimums — unchanged since 2015, one article
6. IRPF brackets — requires checking both general + ahorro, 2025 ahorro change needs careful verification

---

## Phase 2 — "Autonomos + Social Security + Withholding" (target: v0.2.0)

Goal: Cover the **autonomo use case end-to-end** (RETA contributions, IRPF withholding estimation, quarterly obligations) and add CCAA regional brackets. This is where the MCP becomes indispensable for tax advisors and AI agents helping self-employed workers.

| ID | Task | Est | Depends | Notes |
|----|------|-----|---------|-------|
| MCP-30 | Data: RETA contributions 2023-2026 (15 income brackets, bases, rates, quotas) | M | — | 12 general + 3 reduced brackets. Bases min/max per bracket. Include MEI rate (0.66% in 2025), tarifa plana (80 EUR/12 months). Source: RD cotizacion + Seguridad Social portal |
| ~~MCP-31~~ | ~~Data: Social Security general regime 2024-2026 (bases, rates, MEI)~~ | ~~M~~ | — | **DONE (2026-03-22)** — Implemented as `get_ss_rates` tool in v1.1.0. Worker rates (CC 4.70%, desempleo, FP, MEI), contribution bases (max/min by group), solidarity surcharge tranches. 2025: Orden PJC/178/2025 (BOE-A-2025-3780). 2026: RDL 3/2026 (BOE-A-2026-2548). 14 tests. Branch: `feature/get-ss-rates` |
| MCP-32 | Data: IRPF regional brackets 2024-2025 (17 CCAA + Ceuta + Melilla) | L | — | 19 sets of brackets. Each with its own law source. Hacienda publishes consolidated "Tributacion Autonomica" PDF annually. Most complex data task in this phase |
| MCP-33 | Data: main CCAA deductions 2025 (housing, family, disability — top 5 per CCAA) | L | — | Only the most relevant deductions per CCAA. Full catalog is 200+ deductions — scope to top 5 by usage. Source: Manual Renta 2025 Part 2 |
| MCP-34 | Data: IRPF work income reduction 2025 (art. 20 Ley IRPF) | S | — | The "reduccion rendimientos del trabajo" scale (up to 7.302 EUR net). Critical for withholding calculation. New 340 EUR deduction for rentas <= 16.576 EUR (RDL 16/2025) |
| MCP-35 | Data: Beckham Law / Regimen de Impatriados (art. 93 Ley IRPF) | S | — | 24% flat rate up to 600K EUR, 47% above. 5-year prior non-residency requirement. 6-year duration. Growing demand from expats and digital nomads. Source: art. 93 Ley 35/2006 + arts. 113-120 RIRPF |
| MCP-36 | Tool: `get_social_security(year, regime?)` — extend with RETA | M | MCP-30 | General regime DONE as `get_ss_rates` (v1.1.0). Pending: add `regime` param + RETA data (MCP-30 dependency) |
| MCP-37 | Tool: `get_reta_quota(year, monthly_income)` | S | MCP-30 | Given monthly net income, returns applicable bracket, base min/max, quota range. High utility for autonomos |
| MCP-38 | Tool: `get_irpf_brackets(year, ccaa?, type?)` | M | MCP-32 | Extends Phase 1 tool. If ccaa provided, returns regional brackets. If omitted, returns state-only |
| MCP-39 | Tool: `get_ccaa_deductions(year, ccaa)` | M | MCP-33 | Returns top deductions for the specified CCAA |
| MCP-40 | Tool: `estimate_withholding(annual_salary, personal_situation)` | M | MCP-03, MCP-04, MCP-34 | Estimates IRPF withholding percentage. personal_situation: { children, disability, contract_type, ccaa? }. NOT a full IRPF calculator — just withholding estimation |
| MCP-41 | Tool: `get_beckham_law(year)` | S | MCP-35 | Returns requirements, rates, duration, scope. Separate tool because it is an opt-in alternative regime, not the default |
| MCP-42 | Prompt: `autonomo_quarterly_checklist` | S | MCP-12, MCP-36 | "What does an autonomo need to file this quarter?" Uses fiscal calendar + RETA data |
| MCP-43 | Prompt: `tax_situation_analysis` | S | MCP-09, MCP-10, MCP-38 | "Analyze my tax situation given X income, Y situation, Z CCAA." Structured template for agents |
| MCP-44 | Tests: Phase 2 tools + integration tests | M | MCP-36..MCP-41 | Include autonomo scenarios (multiple brackets), withholding edge cases (SMI exempt, disability), CCAA-specific tests |

### Phase 2 rationale

**Added vs. original:**
- Beckham Law (MCP-35, MCP-41): New. Growing demand from the expat and digital nomad community. Simple data (flat rate + requirements), low curation effort, high query volume. Should NOT wait until Phase 3.
- `get_reta_quota` (MCP-37): New. The killer tool for autonomos — "I earn X, what's my quota?" Trivial once the data exists.
- Work income reduction (MCP-34): New. Critical for withholding calculation accuracy. Without it, `estimate_withholding` would be wrong for most workers.
- Prompts moved from Phase 3: Prompts are trivial to write once the tools exist. No reason to delay.

**Removed/changed:**
- Original MCP-27 (resource) moved to Phase 1.
- `calculate_withholding` renamed to `estimate_withholding` with explicit scope limitation (NOT a full IRPF calculator).

**Effort assessment:** 2 L-size (CCAA brackets, CCAA deductions), 4 M-size, 6 S-size. The CCAA data tasks are the bottleneck — 19 jurisdictions each with their own legislation. The Hacienda "Tributacion Autonomica" PDF is the single best source but requires manual extraction.

**Data verification difficulty:**
1. Beckham Law — single article, stable rules, easy
2. Work income reduction — one scale, AEAT manual, easy
3. RETA contributions — 15 brackets, published by Seguridad Social, medium
4. SS general regime — more variables (groups, employer/employee), medium
5. CCAA brackets — 19 jurisdictions, annual Hacienda PDF, hard
6. CCAA deductions — 200+ deductions to filter/curate, hardest in this phase

---

## Phase 3 — "Full Tax Coverage + Foral Territories" (target: v0.3.0)

Goal: Cover the remaining major tax domains (ISD, ITP/AJD) and the foral territories. This phase has the highest data curation effort and the most regulatory complexity.

| ID | Task | Est | Depends | Notes |
|----|------|-----|---------|-------|
| MCP-50 | Data: ITP/AJD rates by CCAA 2025 | M | — | Transmisiones patrimoniales (general 6-11% by CCAA for real estate), AJD (0.5-2% by CCAA). Source: CCAA legislation. Medium complexity — fewer variables than ISD |
| MCP-51 | Data: ISD (Sucesiones y Donaciones) by CCAA — 22 jurisdictions | XL | — | The most complex domain: kinship groups (I-IV), base reductions, disability reductions, pre-existing wealth coefficients, CCAA bonifications (some >99%), tariff per group per CCAA. 22 jurisdictions x multiple tables. Source: CCAA legislation + Manual ISD AEAT |
| MCP-52 | Data: foral territories — Bizkaia, Gipuzkoa, Alava, Navarra | XL | — | These are COMPLETE independent tax systems, not variations. Own IRPF brackets, own IVA rules (Concierto Economico), own ISD, own wealth tax. Each needs its own data files. Source: Diputaciones Forales + Gobierno de Navarra |
| MCP-53 | Data: Wealth Tax / ITSGF (Impuesto Temporal Solidaridad Grandes Fortunas) 2025 | M | — | Patrimonio: national + CCAA scales + exemptions. ITSGF: indefinite since 2025 (Ley 7/2024). Combined declaration. Source: Ley 19/1991 + Ley 38/2022 |
| MCP-54 | Tool: `get_itp_rates(ccaa, year, transaction_type?)` | S | MCP-50 | transaction_type: "real_estate" (default), "vehicles", "ajd" |
| MCP-55 | Tool: `get_isd_rules(ccaa, year, kinship_group?, event_type?)` | M | MCP-51 | event_type: "succession" or "donation". Returns reductions, tariff, bonifications for the CCAA + group combo |
| MCP-56 | Tool: `get_foral_tax(territory, tax_type, year)` | M | MCP-52 | territory: "bizkaia", "gipuzkoa", "alava", "navarra". tax_type: "irpf", "iva", "isd", "wealth" |
| MCP-57 | Tool: `get_wealth_tax(year, ccaa?)` | S | MCP-53 | Returns national tariff + CCAA scale if applicable + ITSGF thresholds |
| MCP-58 | Prompt: `inheritance_planning_checklist` | S | MCP-55 | "What do I need to know about inheriting in CCAA X?" Structured template |
| MCP-59 | Prompt: `property_purchase_taxes` | S | MCP-54 | "What taxes apply when buying property in CCAA X?" ITP vs IVA + AJD |
| MCP-60 | Tests: Phase 3 tools + ISD edge cases | L | MCP-54..MCP-57 | ISD is the most error-prone domain. Need tests per CCAA for at least 3-4 representative cases |

### Phase 3 rationale

**Reordered vs. original:**
- ITP/AJD (MCP-50) before ISD (MCP-51). ITP is simpler (one rate per CCAA per transaction type) and has high demand (property purchases). ISD is the most complex domain in all of Spanish tax law.
- Foral territories kept in Phase 3. These are complete parallel tax systems requiring 4x the work. Including them earlier would delay everything else. However, the tool design in Phases 1-2 must accommodate them (e.g., territory parameter).
- Wealth Tax + ITSGF added (MCP-53, MCP-57). Was missing from original backlog. Relevant since ITSGF became indefinite in 2025.

**Removed:**
- Original MCP-35 (prompts) moved to Phase 2.
- Original MCP-36 (historical data 2015-2023) moved to Phase 4. Not worth the effort until current-year coverage is complete.

**Regulatory risks:**
- **ISD is the highest-risk domain**: 22 jurisdictions with radically different rules. Some CCAA bonify 99% for Group I/II (Madrid, Andalucia), others do not. Getting this wrong could lead to wildly incorrect estimates. Needs per-CCAA validation.
- **Foral territories**: Complete independent systems with their own fiscal sovereignty. Data must be sourced from Diputaciones Forales, not AEAT. AEAT manuals do not cover foral territories.
- **Wealth Tax + ITSGF interaction**: Complex — ITSGF acts as a minimum floor over Patrimonio. Some CCAA have 100% Patrimonio bonification (Madrid) but ITSGF still applies.

---

## Phase 4 — "Advanced Features + Historical" (target: v0.4.0)

Goal: Search capabilities, historical data for trend analysis, and advanced prompts for professional use.

| ID | Task | Est | Depends | Notes |
|----|------|-----|---------|-------|
| MCP-70 | Data: historical IRPF brackets 2015-2023 (state only) | M | — | For trend analysis and retroactive calculations |
| MCP-71 | Data: historical IVA rates 2012-2023 (pre-crisis through COVID measures) | S | — | Key changes: 2012 general 18%->21%, 2020-2024 temporary reductions |
| MCP-72 | Data: historical RETA contributions 2023-2025 (transition to income-based system) | S | — | The 2023 reform is a landmark change worth documenting |
| MCP-73 | Tool: `search_tax_rules(query, domain?, year?)` | L | All data | Free-text search across all tax data. Uses keyword matching + structured filters. NOT a legislation search engine (that would require scraping BOE). Searches our curated knowledge base |
| MCP-74 | Tool: `compare_tax_years(year_a, year_b, domain)` | M | MCP-70, MCP-71 | "What changed in IRPF between 2024 and 2025?" Returns diffs |
| MCP-75 | Prompt: `renta_filing_checklist` | S | Phase 1-2 tools | "Complete checklist for filing Renta 2025." Comprehensive template |
| MCP-76 | Prompt: `autonomo_first_year_guide` | S | Phase 2 tools | "I just became autonomo, what do I need to know?" Covers alta, RETA, modelo 303/130, fiscal calendar |
| MCP-77 | Prompt: `expat_tax_guide` | S | MCP-41 | "I'm moving to Spain, what are my tax obligations?" Covers residency, Beckham Law, modelo 720/721, first filing |
| MCP-78 | Streamable HTTP transport | M | MCP-01 | Add HTTP transport alongside stdio for remote deployment scenarios |
| MCP-79 | Tool: `get_tax_obligations(profile)` | M | Phase 1-2 tools | Given a taxpayer profile (employed/autonomo/both, income ranges, CCAA), returns list of applicable modelos + deadlines. The "what do I need to file?" tool |
| MCP-80 | Tests: search quality + historical accuracy | M | MCP-73, MCP-74 | Search relevance tests, historical data accuracy vs BOE |
| MCP-81 | Data + Tool: Modelo 720 — BOE record layout, claves, subclaves, thresholds | L | — | Full Registro Tipo 2 field spec (500 chars, positions 1-500). Claves: C (cuentas), V (valores), I (inmuebles), S (seguros). Subclaves per clave. Condicion declarante (1-8). 50K EUR threshold per category. Filing: 1 Jan – 31 Mar. Source: Orden HAP/72/2013 + Orden HFP/1180/2023 + AEAT PDF modelo_720.pdf. This data enables validation of BOE file generators (Financial Tools has critical position layout bugs). **Schedule: fuera de horario laboral** |

### Phase 4 rationale

**New tasks:**
- `search_tax_rules` (MCP-73): PO question answered — YES, a search tool adds significant value, but scoped to our curated data (not raw legislation). Attempting to search raw BOE text would require NLP/scraping infrastructure far beyond scope.
- `compare_tax_years` (MCP-74): High demand — "what changed this year?" is one of the most common questions.
- `get_tax_obligations` (MCP-79): The "meta-tool" that ties everything together. Given a profile, it tells you what you need to file and when.
- `expat_tax_guide` prompt (MCP-77): Natural complement to Beckham Law data.
- HTTP transport (MCP-78): For agents that cannot run local npm packages.

**Deferred from original:**
- Historical data (2015-2023) moved here from Phase 3. Current-year accuracy is the priority.

---

## Parking Lot (evaluated and deferred)

| Idea | Verdict | Reason |
|------|---------|--------|
| `search_legislation(query)` — free-text BOE search | Deferred indefinitely | Would require BOE scraping/NLP infrastructure. Our scope is curated data, not raw legislation. The `search_tax_rules` tool (MCP-73) covers the curated-data use case |
| Real-time BOE monitoring / webhook alerts | Deferred | Interesting but requires a running service (not client-side). Could be a separate MCP server |
| Corporate tax (Impuesto Sociedades) | Deferred | Low demand from individual users/autonomos. Professional accountants have their own tools. Modelo 200 info in catalog is sufficient |
| Modelo 720/721 field-level validation | Deferred | Already covered by Financial Tools web app. MCP should expose reference data, not replicate full-form logic |
| International double taxation treaties | Out of scope | Requires per-country analysis. Not feasible to curate |
| Crypto-specific tax rules | Phase 3 candidate | Could add to ISD/gains data. Casillas 1802-1806 already documented. Revisit when Phase 2 ships |
| SEPE unemployment benefits calculator | Deferred | Labor law, not tax law. Different knowledge domain |

---

## Dependency Graph

```
Phase 1 (MVP)
  MCP-01 (scaffolding) ─┬─> MCP-02..MCP-07 (data)
                         └─> MCP-14 (validate_tax_id)
  MCP-02 ──> MCP-08 (get_vat_rates) ──> MCP-16 (resource)
  MCP-03 ──> MCP-09 (get_irpf_brackets) ─┬─> MCP-15 (resource)
  MCP-04 ──> MCP-10 (get_personal_minimums) ─┘
  MCP-05 ──> MCP-11 (get_indicators)
  MCP-06 ──> MCP-12 (get_fiscal_calendar) ──> MCP-17 (resource)
  MCP-07 ──> MCP-13 (get_tax_form_info)
  MCP-08..MCP-14 ──> MCP-18 (tests)
  MCP-18 + MCP-19 ──> MCP-20 (publish)

Phase 2 (Autonomos + CCAA)
  MCP-30 ──> MCP-36, MCP-37
  MCP-31 ──> MCP-36
  MCP-32 ──> MCP-38
  MCP-33 ──> MCP-39
  MCP-34 + MCP-03 + MCP-04 ──> MCP-40
  MCP-35 ──> MCP-41
  MCP-12 + MCP-36 ──> MCP-42 (prompt)
  MCP-09 + MCP-10 + MCP-38 ──> MCP-43 (prompt)

Phase 3 (Full Coverage)
  MCP-50 ──> MCP-54
  MCP-51 ──> MCP-55
  MCP-52 ──> MCP-56
  MCP-53 ──> MCP-57

Phase 4 (Advanced)
  All data ──> MCP-73 (search)
  MCP-70..72 ──> MCP-74 (compare)
  Phase 1-2 tools ──> MCP-79 (obligations)
```

---

## Effort Key

| Tag | Meaning |
|-----|---------|
| S | Small — < 2 hours. Single data file or simple tool |
| M | Medium — 2-6 hours. Multiple sources to cross-check, or tool with complex logic |
| L | Large — 6-16 hours. Multi-jurisdiction data requiring per-CCAA verification |
| XL | Extra Large — 16+ hours. Complete independent tax systems or 22-jurisdiction datasets |

---

## Summary of Changes from Original Backlog

### Tasks added (11)
| ID | Task | Rationale |
|----|------|-----------|
| MCP-14 | `validate_tax_id` (NIF/NIE/CIF) | High utility, zero data curation, algorithmic only |
| MCP-15..17 | Resources (3) | Moved from Phase 2 — trivial once data exists |
| MCP-34 | Work income reduction data | Required for accurate withholding estimation |
| MCP-35 | Beckham Law data | Growing expat/nomad demand, simple to curate |
| MCP-37 | `get_reta_quota` tool | Killer tool for autonomos |
| MCP-41 | `get_beckham_law` tool | Serves expat use case |
| MCP-53 | Wealth Tax + ITSGF data | Was completely missing; ITSGF now indefinite |
| MCP-57 | `get_wealth_tax` tool | Complements MCP-53 |
| MCP-73 | `search_tax_rules` | Curated-data search (not raw BOE) |
| MCP-74 | `compare_tax_years` | "What changed?" is top query |
| MCP-77..79 | Advanced prompts + obligations tool | Professional-grade templates |

### Tasks merged or removed (2)
| Original | Action | Reason |
|----------|--------|--------|
| MCP-27 (resource) | Merged into Phase 1 (MCP-15..17) | Resources are trivial views of existing data |
| MCP-36 (historical data) | Moved to Phase 4 (MCP-70..72) | Current-year accuracy is the priority |

### Tasks reordered
- IVA data first (already verified) instead of IRPF first
- Data tasks before tool tasks within each phase
- ITP before ISD in Phase 3 (simpler, high demand)
- Prompts moved from Phase 3 to Phase 2 (trivial once tools exist)

### Key PO decisions
- Tool names: **English** (international discoverability)
- URI scheme: **`tax-es://`** (not `aeat://` — avoids trademark implication)
- `search_legislation` full-text BOE search: **deferred indefinitely** (out of scope)
- `validate_tax_id`: **added to MVP** (high demand, zero risk)
- Foral territories: **kept in Phase 3** (complete parallel systems, massive effort)
- Beckham Law: **moved to Phase 2** (simple data, growing demand)

### Key Fiscal decisions
- Data verification order: IVA (verified) > indicators > catalog > calendar > minimums > brackets
- CCAA brackets source: Hacienda "Tributacion Autonomica" consolidated PDF
- CCAA deductions: scoped to top 5 per CCAA (not full 200+ catalog)
- ISD: highest regulatory risk domain, needs per-CCAA validation
- Foral territories: must source from Diputaciones Forales, NOT AEAT manuals
- Every JSON data point must carry `source` (law/article) + `verified_date` fields
- Beckham Law: simple regime, single article, low curation effort

---

## In Progress

| ID | Task | Started | Branch | Notes |
|----|------|---------|--------|-------|

## Done

| ID | Task | Completed | Branch |
|----|------|-----------|--------|
