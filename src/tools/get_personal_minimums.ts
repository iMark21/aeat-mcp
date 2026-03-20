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

export function registerPersonalMinimumsTool(server: McpServer) {
  server.tool(
    "get_personal_minimums",
    "Returns the personal and family tax-free minimums (minimo personal y familiar) " +
      "for Spanish IRPF. Includes taxpayer minimum, descendants, ascendants, " +
      "and disability allowances. These reduce the taxable base. " +
      "Source: Ley 35/2006, arts. 57-61.",
    {
      year: z
        .number()
        .int()
        .min(2024)
        .max(2026)
        .describe("Fiscal year (2024-2026)"),
    },
    async ({ year }) => {
      const data = loadData(year);
      if (!data || !data.personal_minimums) {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                error: "no_data",
                message: `No personal minimums data for year ${year}.`,
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
                year,
                minimums: data.personal_minimums,
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
