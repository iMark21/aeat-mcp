import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

let casillasData: any = null;

function loadCasillas() {
  if (casillasData) return casillasData;
  const path = join(
    __dirname,
    "..",
    "data",
    "irpf",
    "manual",
    "casillas-modelo-100.json"
  );
  try {
    casillasData = JSON.parse(readFileSync(path, "utf-8"));
    return casillasData;
  } catch {
    return null;
  }
}

export function registerSearchCasillasTool(server: McpServer) {
  server.tool(
    "search_casillas",
    "Searches the Modelo 100 (IRPF) casilla map by number or keyword. " +
      "Use a casilla number (e.g., '0001') to get its definition, " +
      "or a keyword (e.g., 'dividendos', 'alquiler') to find relevant casillas. " +
      "Returns casilla number, name, section, and source article. " +
      "Source: AEAT Manual Practico Renta 2025.",
    {
      query: z
        .string()
        .min(1)
        .describe(
          "Casilla number (e.g., '0001', '0596') or keyword (e.g., 'dividendos', 'trabajo')"
        ),
    },
    async ({ query }) => {
      const data = loadCasillas();
      if (!data || !data.casillas) {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                error: "no_data",
                message: "Casilla data not available.",
              }),
            },
          ],
        };
      }

      const casillas = data.casillas;
      const q = query.toLowerCase().trim();

      // Search by number first
      const byNumber = casillas.filter(
        (c: any) => c.number === q || c.number === q.padStart(4, "0")
      );

      if (byNumber.length > 0) {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  query,
                  match_type: "exact_number",
                  results: byNumber,
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

      // Search by keyword
      const keywords = q.split(/\s+/).filter((k: string) => k.length >= 2);
      const byKeyword = casillas.filter((c: any) => {
        const text = `${c.number} ${c.name} ${c.section} ${c.source || ""}`.toLowerCase();
        return keywords.every((kw: string) => text.includes(kw));
      });

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                query,
                match_type: "keyword",
                total_matches: byKeyword.length,
                results: byKeyword.slice(0, 15),
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
