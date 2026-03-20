import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadData(year: number) {
  const path = join(__dirname, "..", "data", "calendar", `${year}.json`);
  try {
    return JSON.parse(readFileSync(path, "utf-8"));
  } catch {
    return null;
  }
}

export function registerFiscalCalendarTool(server: McpServer) {
  server.tool(
    "get_fiscal_calendar",
    "Returns Spanish AEAT fiscal calendar deadlines for a given year. " +
      "Filter by quarter (1-4) to see only that quarter's deadlines. " +
      "Filter by modelo (e.g., '303', '100') to see deadlines for a specific tax form. " +
      "Each deadline includes start/end dates, description, and who must file. " +
      "Source: AEAT Calendario del Contribuyente.",
    {
      year: z
        .number()
        .int()
        .min(2024)
        .max(2026)
        .describe("Year (2024-2026)"),
      quarter: z
        .number()
        .int()
        .min(1)
        .max(4)
        .optional()
        .describe("Filter by quarter (1=Jan-Mar, 2=Apr-Jun, 3=Jul-Sep, 4=Oct-Dec)"),
      modelo: z
        .string()
        .optional()
        .describe("Filter by tax form number (e.g., '303', '100', '720')"),
    },
    async ({ year, quarter, modelo }) => {
      const data = loadData(year);
      if (!data) {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                error: "no_data",
                message: `No fiscal calendar data for year ${year}. Available: 2026.`,
              }),
            },
          ],
        };
      }

      let deadlines = data.deadlines;

      if (quarter) {
        const quarterMonths: Record<number, number[]> = {
          1: [1, 2, 3],
          2: [4, 5, 6],
          3: [7, 8, 9],
          4: [10, 11, 12],
        };
        const months = quarterMonths[quarter];
        deadlines = deadlines.filter((d: any) => {
          const month = parseInt(d.date_end.split("-")[1], 10);
          return months.includes(month);
        });
      }

      if (modelo) {
        deadlines = deadlines.filter(
          (d: any) => d.modelo === modelo
        );
      }

      // Find next upcoming deadline
      const today = new Date().toISOString().split("T")[0];
      const nextDeadline = deadlines.find(
        (d: any) => d.date_end >= today
      );

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                year,
                filters: { quarter: quarter ?? "all", modelo: modelo ?? "all" },
                total_deadlines: deadlines.length,
                next_deadline: nextDeadline ?? null,
                deadlines,
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
