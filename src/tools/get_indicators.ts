import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadData(year: number) {
  const path = join(__dirname, "..", "data", "indicators", `${year}.json`);
  try {
    return JSON.parse(readFileSync(path, "utf-8"));
  } catch {
    return null;
  }
}

export function registerIndicatorsTool(server: McpServer) {
  server.tool(
    "get_indicators",
    "Returns key Spanish economic indicators for a given year: " +
      "IPREM (public income reference), SMI (minimum wage), " +
      "legal interest rate, and late payment interest rate. " +
      "These are used as thresholds in tax calculations, subsidies, and legal proceedings. " +
      "Source: PGE (national budget) + BOE.",
    {
      year: z
        .number()
        .int()
        .min(2024)
        .max(2026)
        .describe("Year (2024-2026)"),
      indicator: z
        .enum(["iprem", "smi", "legal_interest_rate", "late_payment_interest_rate"])
        .optional()
        .describe("Filter by specific indicator (optional, returns all if omitted)"),
    },
    async ({ year, indicator }) => {
      const data = loadData(year);
      if (!data) {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                error: "no_data",
                message: `No indicator data for year ${year}. Available: 2025, 2026.`,
              }),
            },
          ],
        };
      }

      const result = indicator
        ? { [indicator]: data.indicators[indicator] }
        : data.indicators;

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                year,
                indicators: result,
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
