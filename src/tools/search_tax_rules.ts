import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { readFileSync, readdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

interface SearchResult {
  file: string;
  section: string;
  matches: Record<string, unknown>[];
}

function loadAllManualData(): Array<{ file: string; data: any }> {
  const manualDir = join(__dirname, "..", "data", "irpf", "manual");
  const files: Array<{ file: string; data: any }> = [];

  try {
    for (const f of readdirSync(manualDir)) {
      if (f.endsWith(".json")) {
        const content = readFileSync(join(manualDir, f), "utf-8");
        files.push({ file: f.replace(".json", ""), data: JSON.parse(content) });
      }
    }
  } catch {
    // Directory might not exist
  }

  return files;
}

function searchInObject(
  obj: any,
  keywords: string[],
  path: string
): Array<{ path: string; item: any }> {
  const results: Array<{ path: string; item: any }> = [];

  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      const item = obj[i];
      const itemStr = JSON.stringify(item).toLowerCase();
      if (keywords.every((kw) => itemStr.includes(kw))) {
        results.push({ path: `${path}[${i}]`, item });
      }
    }
  } else if (obj && typeof obj === "object") {
    for (const [key, value] of Object.entries(obj)) {
      if (Array.isArray(value)) {
        results.push(...searchInObject(value, keywords, `${path}.${key}`));
      } else if (value && typeof value === "object") {
        const itemStr = JSON.stringify(value).toLowerCase();
        if (keywords.every((kw) => itemStr.includes(kw))) {
          results.push({ path: `${path}.${key}`, item: value });
        }
      }
    }
  }

  return results;
}

export function registerSearchTaxRulesTool(server: McpServer) {
  server.tool(
    "search_tax_rules",
    "Searches across all IRPF tax rules data for a given keyword or concept. " +
      "Searches in: work income, rental income, investment income, capital gains, " +
      "deductions, and casilla definitions. " +
      "Use natural terms like 'alquiler', 'dividendos', 'maternidad', 'vehiculo electrico', " +
      "'plan pensiones', 'vivienda habitual', 'despido', etc. " +
      "Returns matching rules with casilla numbers, limits, and source articles. " +
      "Source: AEAT Manual Practico Renta 2025.",
    {
      query: z
        .string()
        .min(2)
        .describe(
          "Search term (e.g., 'alquiler', 'dividendos', 'maternidad', 'despido', 'criptomonedas')"
        ),
      domain: z
        .enum([
          "all",
          "trabajo",
          "inmobiliario",
          "mobiliario",
          "ganancias",
          "deducciones",
          "casillas",
        ])
        .optional()
        .default("all")
        .describe("Filter by tax domain (default: search all)"),
    },
    async ({ query, domain }) => {
      const allFiles = loadAllManualData();
      if (allFiles.length === 0) {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                error: "no_data",
                message: "No IRPF manual data available.",
              }),
            },
          ],
        };
      }

      const domainMap: Record<string, string[]> = {
        trabajo: ["rendimientos-trabajo"],
        inmobiliario: ["rendimientos-capital-inmobiliario"],
        mobiliario: ["rendimientos-capital-mobiliario"],
        ganancias: ["ganancias-patrimoniales"],
        deducciones: ["deducciones-estatales"],
        casillas: ["casillas-modelo-100"],
      };

      const filesToSearch =
        domain === "all"
          ? allFiles
          : allFiles.filter((f) => domainMap[domain]?.includes(f.file));

      const keywords = query
        .toLowerCase()
        .split(/\s+/)
        .filter((k) => k.length >= 2);

      const results: SearchResult[] = [];

      for (const { file, data } of filesToSearch) {
        const matches = searchInObject(data, keywords, file);
        if (matches.length > 0) {
          results.push({
            file,
            section: data.chapter || data.year?.toString() || file,
            matches: matches.slice(0, 10).map((m) => m.item),
          });
        }
      }

      const totalMatches = results.reduce(
        (sum, r) => sum + r.matches.length,
        0
      );

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                query,
                domain,
                total_matches: totalMatches,
                results:
                  totalMatches > 0
                    ? results
                    : {
                        message: `No results for '${query}'. Try broader terms or domain='all'.`,
                        suggestions: [
                          "trabajo",
                          "alquiler",
                          "dividendos",
                          "ganancias",
                          "deduccion",
                          "maternidad",
                          "autonomo",
                          "pension",
                        ],
                      },
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
