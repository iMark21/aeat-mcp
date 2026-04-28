# AEAT MCP — Product Brief

## Product Vision

AEAT MCP is an open-source Model Context Protocol server that exposes Spanish
tax reference data as structured, source-backed tools for AI agents. It helps
agents answer fiscal questions with official references instead of unverified
web summaries.

## Target Users

| Persona | Description | Key Need |
| --- | --- | --- |
| AI agent builder | Adds Spanish fiscal lookup capability to an assistant | Reliable MCP tools with structured results |
| Tax software developer | Builds calculators or compliance helpers | Versioned source-backed fiscal data |
| Fiscal advisor | Uses AI to draft explanations or check facts | Official references and clear caveats |
| Self-employed taxpayer | Asks an assistant about filings and deadlines | Practical Spanish tax lookups with source links |

## Domain Principles

- Use official sources only: AEAT, BOE, regional official bulletins, foral tax
  authorities, Social Security, and Ministry of the Interior sources.
- Every curated data entry should include a `source` reference and
  `verified_date`.
- Tool names stay in English for MCP interoperability; Spanish fiscal terms stay
  Spanish when they are proper legal concepts.
- The server provides informational reference data, not personalized tax advice.

## Core Product Surface

- VAT, IGIC, and IPSI rates by territory and year.
- IRPF brackets, personal minimums, indicators, fiscal calendar, and tax form
  catalog lookups.
- NIF, NIE, and CIF validation.
- Full-text search over curated tax rules and Modelo 100 box references.
- Regional deductions and Social Security worker contribution data.

## Monetization Model

- None. The project is MIT-licensed open source.
- Distribution value comes through npm usage, public credibility, and reuse by
  AI agents and fiscal tooling.

## Story Ownership

Stories are stored in `stories/` when detailed specs are needed and tracked in
`BACKLOG.md`. Product changes must preserve official-source traceability.

## References

- **CONTEXT.md**: `.ai/CONTEXT.md` — current state, tools, release process, and pending domains
- **BACKLOG.md**: `.ai/BACKLOG.md` — task tracker and data roadmap
