import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

let catalog: any = null;

function loadCatalog() {
  if (catalog) return catalog;
  const path = join(__dirname, "..", "data", "forms", "catalog.json");
  try {
    catalog = JSON.parse(readFileSync(path, "utf-8"));
    return catalog;
  } catch {
    return null;
  }
}

export function registerTaxFormInfoTool(server: McpServer) {
  server.tool(
    "get_tax_form_info",
    "Returns information about a specific Spanish AEAT tax form (modelo). " +
      "Provide the form number (e.g., '100' for IRPF, '303' for IVA, '720' for foreign assets). " +
      "Returns: name, periodicity, who must file, description, filing period. " +
      "Source: AEAT sede electronica.",
    {
      modelo: z
        .string()
        .describe("Tax form number (e.g., '100', '303', '720')"),
    },
    async ({ modelo }) => {
      const data = loadCatalog();
      if (!data) {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                error: "no_data",
                message: "Tax form catalog not available.",
              }),
            },
          ],
        };
      }

      const form = data.forms.find((f: any) => f.modelo === modelo);
      if (!form) {
        const available = data.forms.map((f: any) => f.modelo).join(", ");
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                error: "not_found",
                message: `Form modelo ${modelo} not found. Available: ${available}`,
              }),
            },
          ],
        };
      }

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                ...form,
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
