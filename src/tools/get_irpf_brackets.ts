import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadData(year: number) {
  const path = join(__dirname, "..", "data", "irpf", `${year}.json`);
  try {
    return JSON.parse(readFileSync(path, "utf-8"));
  } catch {
    return null;
  }
}

export function registerIrpfBracketsTool(server: McpServer) {
  server.tool(
    "get_irpf_brackets",
    "Returns Spanish IRPF (income tax) brackets for a given fiscal year. " +
      "type='general' returns the base general (work/business income) brackets. " +
      "type='savings' returns the base del ahorro (capital gains/dividends) brackets. " +
      "These are STATE-level rates only (roughly half of the total rate). " +
      "The other half comes from the CCAA regional scale. " +
      "Source: Ley 35/2006, arts. 63 and 66.",
    {
      year: z
        .number()
        .int()
        .min(2024)
        .max(2026)
        .describe("Fiscal year (2024-2026)"),
      type: z
        .enum(["general", "savings"])
        .optional()
        .default("general")
        .describe("Bracket type: 'general' (work income) or 'savings' (capital gains)"),
    },
    async ({ year, type }) => {
      const data = loadData(year);
      if (!data) {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                error: "no_data",
                message: `No IRPF data available for year ${year}. Available years: 2025.`,
              }),
            },
          ],
        };
      }

      const brackets =
        type === "savings"
          ? data.savings_brackets
          : data.general_brackets;

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                year,
                type,
                level: "state",
                note: "These are state-level rates only (approximately half of total IRPF). Regional (CCAA) rates are added on top.",
                brackets: brackets.state,
                source: brackets.source,
                verified_date: data.verified_date,
                disclaimer:
                  "Informational only. Does not constitute tax advice.",
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );
}
