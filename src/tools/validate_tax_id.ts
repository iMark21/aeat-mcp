import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

const NIF_LETTERS = "TRWAGMYFPDXBNJZSQVHLCKE";

function validateNIF(nif: string): { valid: boolean; formatted: string } {
  const clean = nif.toUpperCase().replace(/[\s-]/g, "");
  const match = clean.match(/^(\d{8})([A-Z])$/);
  if (!match) return { valid: false, formatted: clean };
  const num = parseInt(match[1], 10);
  const expected = NIF_LETTERS[num % 23];
  return { valid: match[2] === expected, formatted: clean };
}

function validateNIE(nie: string): { valid: boolean; formatted: string } {
  const clean = nie.toUpperCase().replace(/[\s-]/g, "");
  const match = clean.match(/^([XYZ])(\d{7})([A-Z])$/);
  if (!match) return { valid: false, formatted: clean };
  const prefix = { X: "0", Y: "1", Z: "2" }[match[1]] ?? "0";
  const num = parseInt(prefix + match[2], 10);
  const expected = NIF_LETTERS[num % 23];
  return { valid: match[3] === expected, formatted: clean };
}

function validateCIF(cif: string): { valid: boolean; formatted: string } {
  const clean = cif.toUpperCase().replace(/[\s-]/g, "");
  const match = clean.match(/^([ABCDEFGHJNPQRSUVW])(\d{7})([A-Z0-9])$/);
  if (!match) return { valid: false, formatted: clean };

  const digits = match[2];
  let sumA = 0;
  let sumB = 0;
  for (let i = 0; i < 7; i++) {
    const d = parseInt(digits[i], 10);
    if (i % 2 === 0) {
      const doubled = d * 2;
      sumB += Math.floor(doubled / 10) + (doubled % 10);
    } else {
      sumA += d;
    }
  }
  const control = (10 - ((sumA + sumB) % 10)) % 10;
  const controlLetter = String.fromCharCode(64 + control); // A=1, B=2...

  const checkChar = match[3];
  const letterTypes = "PQRSW";
  const numberTypes = "ABEH";

  let valid: boolean;
  if (letterTypes.includes(match[1])) {
    valid = checkChar === controlLetter;
  } else if (numberTypes.includes(match[1])) {
    valid = checkChar === String(control);
  } else {
    valid = checkChar === String(control) || checkChar === controlLetter;
  }

  return { valid, formatted: clean };
}

export function registerValidateTaxIdTool(server: McpServer) {
  server.tool(
    "validate_tax_id",
    "Validates a Spanish tax identification number. " +
      "Supports NIF (individuals, 8 digits + letter), " +
      "NIE (foreign residents, X/Y/Z + 7 digits + letter), " +
      "and CIF (companies, letter + 7 digits + control). " +
      "Returns validity, type detected, and formatted value. " +
      "Source: Ministerio del Interior (NIF/NIE algorithm), Real Decreto 1065/2007 (CIF).",
    {
      id: z
        .string()
        .min(1)
        .describe("Tax ID to validate (NIF, NIE, or CIF)"),
    },
    async ({ id }) => {
      const clean = id.toUpperCase().replace(/[\s-]/g, "");

      let type: string;
      let result: { valid: boolean; formatted: string };

      if (/^[XYZ]/.test(clean)) {
        type = "NIE";
        result = validateNIE(clean);
      } else if (/^[A-W]/.test(clean) && /^[A-W]\d/.test(clean)) {
        type = "CIF";
        result = validateCIF(clean);
      } else if (/^\d/.test(clean)) {
        type = "NIF";
        result = validateNIF(clean);
      } else {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                id: clean,
                valid: false,
                type: "unknown",
                message: "Could not determine ID type. Expected NIF (12345678Z), NIE (X1234567L), or CIF (A12345678).",
              }),
            },
          ],
        };
      }

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              id: result.formatted,
              valid: result.valid,
              type,
              message: result.valid
                ? `Valid ${type}`
                : `Invalid ${type}: check digit does not match`,
            }),
          },
        ],
      };
    }
  );
}
