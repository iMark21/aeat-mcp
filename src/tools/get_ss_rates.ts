import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadData(year: number) {
  const path = join(__dirname, "..", "data", "ss", `${year}.json`);
  try {
    return JSON.parse(readFileSync(path, "utf-8"));
  } catch {
    return null;
  }
}

export function registerSsRatesTool(server: McpServer) {
  server.tool(
    "get_ss_rates",
    "Returns Spanish Social Security (Seguridad Social) contribution rates for employees " +
      "in the Regimen General. Includes worker-side rates for common contingencies, unemployment, " +
      "vocational training, and the MEI (Mecanismo de Equidad Intergeneracional). " +
      "Also returns maximum and minimum contribution bases. " +
      "SS cotizaciones are deductible in IRPF (art. 19.2.a Ley 35/2006, casilla 0013). " +
      "Source: Orden de cotizacion SS (BOE) + RDL 3/2026.",
    {
      year: z
        .number()
        .int()
        .min(2025)
        .max(2026)
        .describe("Year (2025 or 2026)"),
      section: z
        .enum(["rates", "bases", "solidarity", "all"])
        .default("all")
        .describe(
          "Section to return: 'rates' (worker contribution rates), " +
            "'bases' (max/min contribution bases), " +
            "'solidarity' (surcharge above base max), " +
            "'all' (full data)"
        ),
    },
    async ({ year, section }) => {
      const data = loadData(year);
      if (!data) {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                error: "no_data",
                message: `No SS data for year ${year}. Available: 2025, 2026.`,
              }),
            },
          ],
        };
      }

      let result: Record<string, unknown>;
      switch (section) {
        case "rates":
          result = {
            year,
            worker_rates: data.worker_rates,
            source: data.source,
            verified_date: data.verified_date,
          };
          break;
        case "bases":
          result = {
            year,
            contribution_bases: data.contribution_bases,
            source: data.source,
            verified_date: data.verified_date,
          };
          break;
        case "solidarity":
          result = {
            year,
            solidarity_surcharge: data.solidarity_surcharge,
            source: data.source,
            verified_date: data.verified_date,
          };
          break;
        default:
          result = {
            year,
            regime: data.regime,
            worker_rates: data.worker_rates,
            contribution_bases: data.contribution_bases,
            solidarity_surcharge: data.solidarity_surcharge,
            source: data.source,
            verified_date: data.verified_date,
            note: data.note,
          };
      }

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                ...result,
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
