import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { readFileSync, readdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

let allCcaaData: Record<string, any> | null = null;

function loadAllCcaa(): Record<string, any> {
  if (allCcaaData) return allCcaaData;

  allCcaaData = {};
  const ccaaDir = join(__dirname, "..", "data", "irpf", "ccaa");

  try {
    for (const f of readdirSync(ccaaDir)) {
      if (f.endsWith(".json")) {
        const content = JSON.parse(readFileSync(join(ccaaDir, f), "utf-8"));
        if (content.ccaa) {
          Object.assign(allCcaaData, content.ccaa);
        }
      }
    }
  } catch {
    // Directory might not exist
  }

  return allCcaaData;
}

const CCAA_ALIASES: Record<string, string> = {
  andalucia: "andalucia",
  aragon: "aragon",
  asturias: "asturias",
  baleares: "illes_balears",
  illes_balears: "illes_balears",
  balears: "illes_balears",
  canarias: "canarias",
  cantabria: "cantabria",
  castilla_la_mancha: "castilla_la_mancha",
  castilla_mancha: "castilla_la_mancha",
  clm: "castilla_la_mancha",
  castilla_y_leon: "castilla_y_leon",
  castilla_leon: "castilla_y_leon",
  cyl: "castilla_y_leon",
  cataluna: "cataluna",
  catalunya: "cataluna",
  extremadura: "extremadura",
  galicia: "galicia",
  madrid: "madrid",
  murcia: "murcia",
  la_rioja: "la_rioja",
  rioja: "la_rioja",
  valenciana: "valenciana",
  valencia: "valenciana",
  comunitat_valenciana: "valenciana",
  ceuta: "ceuta",
  melilla: "melilla",
};

export function registerCcaaDeductionsTool(server: McpServer) {
  server.tool(
    "get_ccaa_deductions",
    "Returns all tax deductions available in a specific Spanish autonomous community (CCAA). " +
      "Covers all 17 CCAA + Ceuta + Melilla. Each deduction includes amount/percentage, " +
      "limits, income requirements, and legal source. " +
      "Use common names: 'baleares', 'madrid', 'cataluna', 'valencia', etc. " +
      "Source: AEAT Manual Practico Renta 2025, Parte 2 — Deducciones Autonomicas.",
    {
      ccaa: z
        .string()
        .min(2)
        .describe(
          "Autonomous community name (e.g., 'baleares', 'madrid', 'cataluna', 'valencia', 'andalucia')"
        ),
      query: z
        .string()
        .optional()
        .describe(
          "Optional keyword to filter deductions (e.g., 'alquiler', 'hijo', 'vivienda', 'donacion')"
        ),
    },
    async ({ ccaa, query }) => {
      const data = loadAllCcaa();
      if (Object.keys(data).length === 0) {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                error: "no_data",
                message: "CCAA deductions data not available.",
              }),
            },
          ],
        };
      }

      const key = CCAA_ALIASES[ccaa.toLowerCase().replace(/[\s-]/g, "_")] ?? ccaa.toLowerCase().replace(/[\s-]/g, "_");
      const ccaaData = data[key];

      if (!ccaaData) {
        const available = Object.keys(data).join(", ");
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                error: "not_found",
                message: `CCAA '${ccaa}' not found. Available: ${available}`,
                suggestion: "Try common names: baleares, madrid, cataluna, valencia, andalucia",
              }),
            },
          ],
        };
      }

      let deductions = ccaaData.deductions || [];

      if (query) {
        const keywords = query.toLowerCase().split(/\s+/).filter((k: string) => k.length >= 2);
        deductions = deductions.filter((d: any) => {
          const text = JSON.stringify(d).toLowerCase();
          return keywords.every((kw: string) => text.includes(kw));
        });
      }

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                ccaa: ccaaData.name || key,
                year: 2025,
                total_deductions: deductions.length,
                query: query ?? null,
                deductions,
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
