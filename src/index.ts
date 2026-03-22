#!/usr/bin/env node

import { createRequire } from "module";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerVatRatesTool } from "./tools/get_vat_rates.js";
import { registerIrpfBracketsTool } from "./tools/get_irpf_brackets.js";
import { registerPersonalMinimumsTool } from "./tools/get_personal_minimums.js";
import { registerIndicatorsTool } from "./tools/get_indicators.js";
import { registerValidateTaxIdTool } from "./tools/validate_tax_id.js";
import { registerFiscalCalendarTool } from "./tools/get_fiscal_calendar.js";
import { registerTaxFormInfoTool } from "./tools/get_tax_form_info.js";
import { registerSearchTaxRulesTool } from "./tools/search_tax_rules.js";
import { registerSearchCasillasTool } from "./tools/search_casillas.js";
import { registerCcaaDeductionsTool } from "./tools/get_ccaa_deductions.js";
import { registerSsRatesTool } from "./tools/get_ss_rates.js";

const require = createRequire(import.meta.url);
const { version } = require("../package.json") as { version: string };

const server = new McpServer({
  name: "aeat-mcp",
  version,
  description:
    "Spanish AEAT tax reference data for AI agents. " +
    "IRPF brackets, VAT rates, economic indicators, fiscal calendar, and more. " +
    "All data sourced exclusively from official sources (BOE, AEAT). " +
    "DISCLAIMER: Informational only, does not constitute tax advice.",
});

// Register all tools
registerVatRatesTool(server);
registerIrpfBracketsTool(server);
registerPersonalMinimumsTool(server);
registerIndicatorsTool(server);
registerValidateTaxIdTool(server);
registerFiscalCalendarTool(server);
registerTaxFormInfoTool(server);
registerSearchTaxRulesTool(server);
registerSearchCasillasTool(server);
registerCcaaDeductionsTool(server);
registerSsRatesTool(server);

// Start server
const transport = new StdioServerTransport();
await server.connect(transport);
