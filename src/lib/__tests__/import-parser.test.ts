import { describe, expect, it } from "vitest";
import { detectColumnMapping, duplicateEventKey, isHomeGame, normalizeColumnName, parseExcelDate, parseTime, previewRows } from "../import/parser";

describe("import parser", () => {
  it("normalizes spreadsheet columns", () => {
    expect(normalizeColumnName(" Event Name ")).toBe("event name");
    expect(detectColumnMapping(["Date", "Opponent", "9th", "JV", "Varsity"]).ninth).toBe("9th");
  });

  it("parses spreadsheet dates", () => {
    expect(parseExcelDate("08/18/2026")).toBe("2026-08-18");
    expect(parseExcelDate(46213)).toBe("2026-07-10");
  });

  it("parses common time formats", () => {
    expect(parseTime("4:30 PM")).toBe("16:30");
    expect(parseTime("12 am")).toBe("00:00");
    expect(parseTime(0.75)).toBe("18:00");
  });

  it("detects home games", () => {
    const row = { Site: "Home", Location: "Whitehouse High School" };
    expect(isHomeGame(row, { site: "Site", location: "Location" })).toBe(true);
  });

  it("detects likely duplicates and invalid rows", () => {
    const rows = previewRows([
      { Date: "08/18/2026", Opponent: "Tyler Legacy", Site: "Home", Location: "WHS" },
      { Date: "08/18/2026", Opponent: "Tyler Legacy", Site: "Home", Location: "WHS" },
      { Date: "not a date", Opponent: "", Site: "Away", Location: "Away" },
    ]);
    expect(rows[1].warnings).toContain("Possible duplicate event in this import.");
    expect(rows[2].errors).toContain("Missing or invalid event date.");
    expect(rows[2].errors).toContain("Missing opponent or event name.");
    expect(duplicateEventKey(rows[0])).toBe("2026-08-18-tyler-legacy-whs");
  });
});
