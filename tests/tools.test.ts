import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, "..", "src", "data");

function loadJson(path: string) {
  return JSON.parse(readFileSync(join(dataDir, path), "utf-8"));
}

// ============================================
// IVA DATA TESTS
// ============================================
describe("IVA rates data", () => {
  const data = loadJson("iva/2025.json");

  it("has 3 standard rates", () => {
    expect(data.rates).toHaveLength(3);
  });

  it("general rate is 21%", () => {
    const general = data.rates.find((r: any) => r.type === "general");
    expect(general.rate).toBe(21);
    expect(general.source).toContain("Ley 37/1992");
  });

  it("reduced rate is 10%", () => {
    const reducido = data.rates.find((r: any) => r.type === "reducido");
    expect(reducido.rate).toBe(10);
  });

  it("super-reduced rate is 4%", () => {
    const super_red = data.rates.find((r: any) => r.type === "superreducido");
    expect(super_red.rate).toBe(4);
    expect(super_red.source).toContain("RDL 4/2024");
  });

  it("surcharge for 21% IVA is 5.2%", () => {
    const surcharge = data.surcharges.find((s: any) => s.vat_rate === 21);
    expect(surcharge.surcharge_rate).toBe(5.2);
  });

  it("has IGIC data for Canarias", () => {
    expect(data.igic.territory).toBe("canarias");
    expect(data.igic.rates.find((r: any) => r.type === "general").rate).toBe(7);
  });

  it("every rate has a source", () => {
    for (const rate of data.rates) {
      expect(rate.source).toBeTruthy();
    }
  });
});

// ============================================
// IRPF DATA TESTS
// ============================================
describe("IRPF brackets data", () => {
  const data = loadJson("irpf/2025.json");

  it("has 6 general brackets (state)", () => {
    expect(data.general_brackets.state).toHaveLength(6);
  });

  it("first general bracket starts at 0", () => {
    expect(data.general_brackets.state[0].from).toBe(0);
  });

  it("last general bracket has no upper limit", () => {
    const last = data.general_brackets.state[data.general_brackets.state.length - 1];
    expect(last.to).toBeNull();
  });

  it("has 5 savings brackets (state)", () => {
    expect(data.savings_brackets.state).toHaveLength(5);
  });

  it("2025 savings top bracket is 15% (up from 14%)", () => {
    const last = data.savings_brackets.state[data.savings_brackets.state.length - 1];
    expect(last.rate).toBe(15);
    expect(last.from).toBe(300000);
  });

  it("savings source mentions Ley 7/2024 change", () => {
    expect(data.savings_brackets.source).toContain("Ley 7/2024");
  });
});

// ============================================
// WORK INCOME REDUCTION TESTS (art. 20 LIRPF)
// ============================================
describe("Work income reduction data (verified against AEAT Manual 2025)", () => {
  const data = loadJson("irpf/2025.json");
  const wir = data.work_income_reduction;

  it("has 4-step scale (RDL 4/2024 version, NOT pre-2024)", () => {
    expect(wir.scale).toHaveLength(4);
  });

  it("step a: net income <= 14852 → reduction 7302", () => {
    expect(wir.scale[0].net_income_up_to).toBe(14852);
    expect(wir.scale[0].reduction).toBe(7302);
  });

  it("step b: coefficient is 1.75 (NOT 2.59 pre-2024)", () => {
    expect(wir.scale[1].reduction_formula).toContain("1.75");
    expect(wir.scale[1].reduction_formula).not.toContain("2.59");
  });

  it("step c: 17673.52 to 19747.5, coefficient 1.14", () => {
    expect(wir.scale[2].net_income_from).toBe(17673.52);
    expect(wir.scale[2].net_income_up_to).toBe(19747.5);
    expect(wir.scale[2].reduction_formula).toContain("2364.34");
    expect(wir.scale[2].reduction_formula).toContain("1.14");
  });

  it("step d: above 19747.5 → reduction 0", () => {
    expect(wir.scale[3].net_income_above).toBe(19747.5);
    expect(wir.scale[3].reduction).toBe(0);
  });

  it("source cites RDL 4/2024 modification", () => {
    expect(wir.source).toContain("RDL 4/2024");
  });

  it("new 2025 deduction: 340 EUR, source Ley 5/2025", () => {
    expect(wir.new_2025_deduction.amount).toBe(340);
    expect(wir.new_2025_deduction.source).toContain("Ley 5/2025");
    expect(wir.new_2025_deduction.source).not.toContain("RDL 16/2025");
  });
});

// ============================================
// PERSONAL MINIMUMS TESTS
// ============================================
describe("Personal minimums data", () => {
  const data = loadJson("irpf/2025.json");
  const mins = data.personal_minimums;

  it("taxpayer general minimum is 5550 EUR", () => {
    expect(mins.taxpayer.general).toBe(5550);
  });

  it("first descendant minimum is 2400 EUR", () => {
    expect(mins.descendants.first).toBe(2400);
  });

  it("descendants increase with order (2400 < 2700 < 4000 < 4500)", () => {
    expect(mins.descendants.first).toBeLessThan(mins.descendants.second);
    expect(mins.descendants.second).toBeLessThan(mins.descendants.third);
    expect(mins.descendants.third).toBeLessThan(mins.descendants.fourth_and_beyond);
  });

  it("every minimum category has a source", () => {
    expect(mins.taxpayer.source).toContain("art. 57");
    expect(mins.descendants.source).toContain("art. 58");
    expect(mins.ascendants.source).toContain("art. 59");
    expect(mins.disability.source).toContain("art. 60");
  });
});

// ============================================
// INDICATORS TESTS
// ============================================
describe("Economic indicators data", () => {
  const data2025 = loadJson("indicators/2025.json");
  const data2026 = loadJson("indicators/2026.json");

  it("2025 IPREM monthly is 600 EUR", () => {
    expect(data2025.indicators.iprem.monthly).toBe(600);
  });

  it("2025 SMI monthly is 1184 EUR", () => {
    expect(data2025.indicators.smi.monthly).toBe(1184);
  });

  it("2025 legal interest rate is 3.25%", () => {
    expect(data2025.indicators.legal_interest_rate.rate).toBe(3.25);
  });

  it("late payment = legal * 1.25", () => {
    expect(data2025.indicators.late_payment_interest_rate.rate).toBe(
      data2025.indicators.legal_interest_rate.rate * 1.25
    );
  });

  it("2026 SMI monthly is 1221 EUR", () => {
    expect(data2026.indicators.smi.monthly).toBe(1221);
  });

  it("every indicator has a source", () => {
    for (const [, v] of Object.entries(data2025.indicators)) {
      expect((v as any).source).toBeTruthy();
    }
  });
});

// ============================================
// NIF/NIE/CIF VALIDATION TESTS
// ============================================
describe("Tax ID validation", () => {
  const NIF_LETTERS = "TRWAGMYFPDXBNJZSQVHLCKE";

  function validateNIF(num: number, letter: string) {
    return NIF_LETTERS[num % 23] === letter;
  }

  it("valid NIF: 12345678Z", () => {
    expect(validateNIF(12345678, "Z")).toBe(true);
  });

  it("invalid NIF: 12345678A", () => {
    expect(validateNIF(12345678, "A")).toBe(false);
  });

  it("valid NIF: 00000000T", () => {
    expect(validateNIF(0, "T")).toBe(true);
  });

  it("NIF letter table: 0=T, 1=R, 2=W, 22=E, 23 wraps to T", () => {
    expect(NIF_LETTERS[0]).toBe("T");
    expect(NIF_LETTERS[1]).toBe("R");
    expect(NIF_LETTERS[2]).toBe("W");
    expect(NIF_LETTERS[22]).toBe("E");
    expect(NIF_LETTERS[23 % 23]).toBe("T");
  });
});

// ============================================
// FISCAL CALENDAR TESTS
// ============================================
describe("Fiscal calendar data", () => {
  const data = loadJson("calendar/2026.json");

  it("has deadlines array", () => {
    expect(data.deadlines).toBeDefined();
    expect(data.deadlines.length).toBeGreaterThan(20);
  });

  it("has verified_date", () => {
    expect(data.verified_date).toBeTruthy();
  });

  it("Renta campaign: April 8 to June 30", () => {
    const renta = data.deadlines.find(
      (d: any) => d.modelo === "100" && d.description.toLowerCase().includes("internet")
    );
    expect(renta).toBeTruthy();
    expect(renta.date_start).toBe("2026-04-08");
    expect(renta.date_end).toBe("2026-06-30");
  });

  it("Modelo 720: deadline March 31", () => {
    const m720 = data.deadlines.find((d: any) => d.modelo === "720");
    expect(m720).toBeTruthy();
    expect(m720.date_end).toBe("2026-03-31");
  });

  it("Segundo plazo IRPF: November 5", () => {
    const segundo = data.deadlines.find((d: any) => d.modelo === "102");
    expect(segundo).toBeTruthy();
    expect(segundo.date_end).toBe("2026-11-05");
  });

  it("every deadline has a source", () => {
    for (const d of data.deadlines) {
      expect(d.source).toBeTruthy();
    }
  });

  it("every deadline has who field", () => {
    for (const d of data.deadlines) {
      expect(["todos", "autonomos", "sociedades", "retenedores"]).toContain(d.who);
    }
  });
});

// ============================================
// TAX FORM CATALOG TESTS
// ============================================
describe("Tax form catalog data", () => {
  const data = loadJson("forms/catalog.json");

  it("has 19+ forms", () => {
    expect(data.forms.length).toBeGreaterThanOrEqual(19);
  });

  it("includes Modelo 100 (IRPF)", () => {
    const m100 = data.forms.find((f: any) => f.modelo === "100");
    expect(m100).toBeTruthy();
    expect(m100.name).toContain("IRPF");
    expect(m100.periodicity).toBe("annual");
  });

  it("includes Modelo 303 (IVA)", () => {
    const m303 = data.forms.find((f: any) => f.modelo === "303");
    expect(m303).toBeTruthy();
    expect(m303.periodicity).toBe("quarterly");
  });

  it("includes Modelo 720 (bienes extranjero)", () => {
    const m720 = data.forms.find((f: any) => f.modelo === "720");
    expect(m720).toBeTruthy();
  });

  it("every form has a source", () => {
    for (const f of data.forms) {
      expect(f.source).toBeTruthy();
    }
  });

  it("every form has who array", () => {
    for (const f of data.forms) {
      expect(Array.isArray(f.who)).toBe(true);
      expect(f.who.length).toBeGreaterThan(0);
    }
  });
});

// ============================================
// SOURCE CITATION INTEGRITY
// ============================================
describe("Source citation integrity", () => {
  it("indicators 2025: no reference to derogated RDL 16/2025", () => {
    const data = loadJson("indicators/2025.json");
    const json = JSON.stringify(data);
    expect(json).not.toContain("RDL 16/2025");
  });

  it("indicators 2025: IPREM cites Ley 31/2022", () => {
    const data = loadJson("indicators/2025.json");
    expect(data.indicators.iprem.source).toContain("Ley 31/2022");
  });

  it("indicators 2025: legal interest cites Ley 31/2022 DA 42", () => {
    const data = loadJson("indicators/2025.json");
    expect(data.indicators.legal_interest_rate.source).toContain("Ley 31/2022");
    expect(data.indicators.legal_interest_rate.source).toContain("42");
  });

  it("indicators 2026: SMI cites RD 126/2026", () => {
    const data = loadJson("indicators/2026.json");
    expect(data.indicators.smi.source).toContain("RD 126/2026");
    expect(data.indicators.smi.source).toContain("BOE-A-2026-3815");
  });

  it("IVA 2025: olive oil cites RDL 4/2024", () => {
    const data = loadJson("iva/2025.json");
    const superred = data.rates.find((r: any) => r.type === "superreducido");
    expect(superred.source).toContain("RDL 4/2024");
  });
});
