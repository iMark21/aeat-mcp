# Changelog — aeat-mcp

All notable changes are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
Versioning: [Semantic Versioning](https://semver.org/)

---

## [Unreleased]

### Added
- `get_ss_rates` tool — Social Security contribution rates (Regimen General) for 2025 and 2026. Returns worker-side rates (contingencias comunes, desempleo, FP, MEI), contribution bases (max/min), and solidarity surcharge tranches. Sources: Orden PJC/178/2025 (BOE-A-2025-3780) and RDL 3/2026 (BOE-A-2026-2548). 14 new tests.
- Data files: `src/data/ss/2025.json` and `src/data/ss/2026.json`

---

## [1.0.1] — 2026-03-22

### Fixed
- Server version string: reads dynamically from `package.json` instead of hardcoded string

---

## [1.0.0] — 2026-03-20

### Added
- Initial public release — 10 tools, Spanish IRPF/IVA/fiscal data for AI agents
- `get_irpf_brackets` — IRPF brackets (general + savings) for 2024–2026. Includes Ley 7/2024 update (300K+ savings bracket from 14% to 15%)
- `get_personal_minimums` — Personal and family tax minimums (arts. 57–61 Ley 35/2006)
- `get_vat_rates` — IVA/IGIC/IPSI rates by territory (2025). Includes RDL 4/2024 olive oil update
- `get_indicators` — IPREM, SMI, legal interest rate, late payment rate (2024–2026)
- `get_fiscal_calendar` — 53 AEAT deadlines for 2026 by quarter and form type
- `get_tax_form_info` — Info on 19 tax forms (Modelo 100, 303, 720, etc.)
- `validate_tax_id` — NIF/NIE/CIF validation with check digit algorithm
- `search_tax_rules` — Full-text search across 18-chapter IRPF manual (rendimientos, capital, ganancias, deducciones)
- `search_casillas` — Modelo 100 casilla map (50+ boxes with section and article references)
- `get_ccaa_deductions` — Regional deductions for all 17 CCAA + Ceuta + Melilla (~350 deductions)
- 52 automated tests (vitest)
- All data sourced exclusively from AEAT and BOE
