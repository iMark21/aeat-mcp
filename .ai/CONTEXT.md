# AEAT MCP — Spanish Fiscal Data Server for AI Agents

**Last Verified:** 2026-04-29

## General Info
- **What:** Open-source MCP server exposing Spanish fiscal legislation as structured data for AI agents (Claude, ChatGPT, Copilot, Cursor)
- **Repo:** [iMark21/aeat-mcp](https://github.com/iMark21/aeat-mcp) (public)
- **npm:** https://www.npmjs.com/package/aeat-mcp
- **Local checkout:** configured in machine-level `projects.local.yaml`
- **Status:** Published
- **Version:** 1.1.0
- **License:** MIT

## Fundamental Rule: Official Sources Only

PROHIBITED to use third-party data (blogs, consultancies, media). All data must come EXCLUSIVELY from official sources:
- AEAT (sede.agenciatributaria.gob.es)
- BOE (boe.es)
- Regional official bulletins (BOJA, BOCM, DOGC, etc.)
- Foral tax authorities (Basque Country, Navarra)
- Social Security (seg-social.es)

Every JSON entry includes `source` (law/article/BOE reference) + `verified_date`. No official source = not included.

## Stack
| Category | Technology |
|----------|-----------|
| Language | TypeScript |
| SDK | @modelcontextprotocol/sdk |
| Validation | Zod |
| Transport | stdio |
| Data format | JSON (curated from BOE/AEAT) |
| Tests | vitest (69 tests) |
| Package | npm (published — aeat-mcp v1.0.0) |

## 11 Tools

| Tool | Description |
|------|------------|
| get_vat_rates | VAT/IGIC/IPSI rates by territory and year |
| get_irpf_brackets | National IRPF brackets (general + savings) |
| get_personal_minimums | Personal and family tax minimums |
| get_indicators | IPREM, SMI, legal interest rate |
| get_fiscal_calendar | AEAT deadlines by quarter/form |
| get_tax_form_info | Info on any tax form (19 forms) |
| validate_tax_id | NIF/NIE/CIF validation |
| search_tax_rules | Full-text search across income tax manual |
| search_casillas | Search Modelo 100 box references |
| get_ccaa_deductions | Regional deductions by autonomous community (17 + Ceuta/Melilla) |
| get_ss_rates | SS worker contribution rates + contribution bases (2025–2026) |

## 16 Data Files (~9,500 lines)

| Directory | Contents |
|-----------|---------|
| data/iva/2025.json | VAT rates, surcharges, IGIC, IPSI |
| data/irpf/2025.json | Brackets, minimums, employment reduction |
| data/indicators/2025-2026.json | IPREM, SMI, legal interest rate |
| data/calendar/2026.json | 53 AEAT deadlines |
| data/forms/catalog.json | 19 tax forms |
| data/irpf/manual/ (7 files) | Complete 2025 Income Tax Manual |
| data/irpf/ccaa/ (3 files) | ~350 regional deductions |

### Income Tax Manual 2025 (7 chapters)
- rendimientos-trabajo.json (674 lines)
- rendimientos-capital-inmobiliario.json (388 lines)
- rendimientos-capital-mobiliario.json (492 lines)
- ganancias-patrimoniales.json (422 lines)
- deducciones-estatales.json (394 lines)
- casillas-modelo-100.json (435 lines, 50+ boxes)
- doble-imposicion-internacional.json (416 lines, 92 CDI countries)

## Verification

| Domain | Status | Validator |
|--------|--------|-----------|
| VAT | VERIFIED | Fiscal agent (18/18 values correct) |
| Indicators | VERIFIED | Fiscal agent (5 sources corrected) |
| IRPF brackets | VERIFIED | Fiscal agent (52/52 correct, 4 errors fixed) |
| Income Tax Manual | Extracted from AEAT | Pending cross-validation |
| Regional deductions | Extracted from AEAT | Pending cross-validation |
| Double taxation treaties | Extracted from AEAT/BOE | Pending cross-validation |

## Release Process

Always use `npm version` for bumps — updates `package.json` and `package-lock.json` atomically:

```bash
npm version patch   # x.y.Z  — fixes, data updates
npm version minor   # x.Y.0  — new tools or data domains
npm version major   # X.0.0  — breaking changes
```

Never edit `package.json` manually to change version: the lockfile gets out of sync.

Full flow:
1. `git checkout -b release/X.Y.Z` from `develop`
2. `npm version patch|minor|major` (creates commit + tag automatically)
3. `npm publish` (runs `prepublishOnly: npm run build` first)
4. Merge to `main` + `develop`, push tag

## Recent Activity

| Date | Action |
|------|--------|
| 2026-04-29 | Added standalone publishable `.ai/` layer with `agentlayer.yaml` v2, project context, product brief, backlog, and stories directory |

## Pending
- Self-employed (direct estimation, deductible expenses)
- Cryptocurrency (swaps, staking, airdrops)
- Joint vs individual filing
- Tourist rental
- Pension plan withdrawal
