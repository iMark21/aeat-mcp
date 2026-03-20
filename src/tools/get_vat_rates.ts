import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadData(year: number) {
  const path = join(__dirname, "..", "data", "iva", `${year}.json`);
  try {
    return JSON.parse(readFileSync(path, "utf-8"));
  } catch {
    return null;
  }
}

export function registerVatRatesTool(server: McpServer) {
  server.tool(
    "get_vat_rates",
    "Returns Spanish VAT (IVA) rates for a given fiscal year. " +
      "Includes general, reduced, and super-reduced rates, plus equivalence surcharges. " +
      "Use territory='canarias' for IGIC or territory='ceuta_melilla' for IPSI. " +
      "Source: Ley 37/1992 del IVA.",
    {
      year: z
        .number()
        .int()
        .min(2024)
        .max(2026)
        .describe("Fiscal year (2024-2026)"),
      territory: z
        .enum(["peninsular", "canarias", "ceuta_melilla"])
        .optional()
        .default("peninsular")
        .describe("Tax territory (default: peninsular Spain)"),
    },
    async ({ year, territory }) => {
      const data = loadData(year);
      if (!data) {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                error: "no_data",
                message: `No VAT data available for year ${year}. Available years: 2024, 2025.`,
              }),
            },
          ],
        };
      }

      let result: Record<string, unknown>;

      if (territory === "canarias") {
        result = {
          year,
          territory: "canarias",
          tax: "IGIC (Impuesto General Indirecto Canario)",
          rates: data.igic?.rates ?? [],
          source: data.igic?.source ?? "",
          disclaimer:
            "Informational only. Does not constitute tax advice.",
        };
      } else if (territory === "ceuta_melilla") {
        result = {
          year,
          territory: "ceuta_melilla",
          tax: "IPSI (Impuesto sobre la Produccion, los Servicios y la Importacion)",
          rates_range: data.ipsi?.rates_range ?? "",
          source: data.ipsi?.source ?? "",
          disclaimer:
            "Informational only. Does not constitute tax advice.",
        };
      } else {
        result = {
          year,
          territory: "peninsular",
          tax: "IVA (Impuesto sobre el Valor Anadido)",
          rates: data.rates,
          surcharges: data.surcharges,
          exemptions: data.exemptions,
          verified_date: data.verified_date,
          disclaimer:
            "Informational only. Does not constitute tax advice.",
        };
      }

      return {
        content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
      };
    }
  );
}
