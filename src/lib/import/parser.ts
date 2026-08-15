import * as XLSX from "xlsx";
import { slugify } from "../utils";

const MAX_WORKSHEETS = 10;
const MAX_ROWS_PER_WORKSHEET = 5_000;
const MAX_COLUMNS_PER_WORKSHEET = 100;

export type ColumnMapping = {
  date?: string;
  opponent?: string;
  site?: string;
  location?: string;
  eventName?: string;
  eventType?: string;
  ninth?: string;
  jv?: string;
  varsity?: string;
  startTime?: string;
  endTime?: string;
  slotName?: string;
  quantityNeeded?: string;
  notes?: string;
};

export type ImportPreviewRow = {
  rowNumber: number;
  raw: Record<string, unknown>;
  normalized: {
    date?: string;
    opponent?: string;
    title?: string;
    location?: string;
    eventType?: string;
    isHome: boolean;
    schedule: Array<{ label: string; time: string }>;
    notes?: string;
  };
  duplicateKey?: string;
  errors: string[];
  warnings: string[];
};

const columnAliases: Record<keyof ColumnMapping, string[]> = {
  date: ["date", "game date", "event date"],
  opponent: ["opponent", "vs", "versus", "team"],
  site: ["site", "home away", "home/away", "h/a"],
  location: ["location", "venue", "gym", "address"],
  eventName: ["event", "event name", "title"],
  eventType: ["event type", "type"],
  ninth: ["9th", "9th grade", "freshman", "fr"],
  jv: ["jv", "junior varsity"],
  varsity: ["varsity", "var"],
  startTime: ["start time", "start", "time"],
  endTime: ["end time", "end"],
  slotName: ["slot name", "position", "volunteer position"],
  quantityNeeded: ["quantity needed", "quantity", "qty", "needed"],
  notes: ["notes", "note", "description"],
};

export function normalizeColumnName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function detectColumnMapping(headers: string[]): ColumnMapping {
  const normalizedHeaders = headers.map((header) => [header, normalizeColumnName(header)] as const);
  return Object.fromEntries(
    Object.entries(columnAliases).flatMap(([field, aliases]) => {
      const match = normalizedHeaders.find(([, normalized]) => aliases.includes(normalized));
      return match ? [[field, match[0]]] : [];
    }),
  ) as ColumnMapping;
}

export function parseExcelDate(value: unknown): string | undefined {
  if (value === null || value === undefined || value === "") return undefined;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 10);
  if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (!parsed) return undefined;
    return `${parsed.y.toString().padStart(4, "0")}-${parsed.m.toString().padStart(2, "0")}-${parsed.d.toString().padStart(2, "0")}`;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
    const match = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
    if (match) {
      const year = match[3].length === 2 ? `20${match[3]}` : match[3];
      return `${year}-${match[1].padStart(2, "0")}-${match[2].padStart(2, "0")}`;
    }
  }
  return undefined;
}

export function parseTime(value: unknown): string | undefined {
  if (value === null || value === undefined || value === "") return undefined;
  if (typeof value === "number") {
    const totalMinutes = Math.round(value * 24 * 60);
    const hours = Math.floor(totalMinutes / 60) % 24;
    const minutes = totalMinutes % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
  }
  const raw = String(value).trim().toLowerCase().replace(/\s+/g, " ");
  const match = raw.match(/^(\d{1,2})(?::(\d{2}))?\s*(a|am|p|pm)?$/);
  if (!match) return undefined;
  let hours = Number(match[1]);
  const minutes = Number(match[2] ?? "0");
  const meridiem = match[3];
  if (minutes > 59 || hours > 24) return undefined;
  if (meridiem?.startsWith("p") && hours < 12) hours += 12;
  if (meridiem?.startsWith("a") && hours === 12) hours = 0;
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
}

export function isHomeGame(row: Record<string, unknown>, mapping: ColumnMapping) {
  const haystack = [mapping.site, mapping.location, mapping.eventName]
    .map((key) => (key ? String(row[key] ?? "") : ""))
    .join(" ")
    .toLowerCase();
  return /\b(home|whitehouse|whitehouse high school|whs)\b/.test(haystack);
}

export function duplicateEventKey(row: Pick<ImportPreviewRow, "normalized">) {
  const { date, opponent, location, title } = row.normalized;
  if (!date) return undefined;
  return slugify([date, opponent || title, location].filter(Boolean).join(" "));
}

export function previewRows(rows: Record<string, unknown>[], mapping?: ColumnMapping): ImportPreviewRow[] {
  const detected = mapping ?? detectColumnMapping(Object.keys(rows[0] ?? {}));
  const seen = new Set<string>();
  return rows.map((row, index) => {
    const errors: string[] = [];
    const warnings: string[] = [];
    const date = detected.date ? parseExcelDate(row[detected.date]) : undefined;
    if (!date) errors.push("Missing or invalid event date.");
    const opponent = detected.opponent ? String(row[detected.opponent] ?? "").trim() : undefined;
    const titleFromSheet = detected.eventName ? String(row[detected.eventName] ?? "").trim() : undefined;
    const title = titleFromSheet || (opponent ? `Whitehouse vs ${opponent}` : undefined);
    if (!title) errors.push("Missing opponent or event name.");
    const location = detected.location ? String(row[detected.location] ?? "").trim() : "Whitehouse High School";
    const schedule = [
      ["9th Grade", detected.ninth],
      ["JV", detected.jv],
      ["Varsity", detected.varsity],
      ["Start", detected.startTime],
    ].flatMap(([label, key]) => {
      const time = key ? parseTime(row[key]) : undefined;
      return time ? [{ label: label as string, time }] : [];
    });
    if (schedule.length === 0) warnings.push("No game times were detected for this row.");
    const normalized = {
      date,
      opponent,
      title,
      location,
      eventType: detected.eventType ? String(row[detected.eventType] ?? "Home Game").trim() : "Home Game",
      isHome: isHomeGame(row, detected),
      schedule,
      notes: detected.notes ? String(row[detected.notes] ?? "").trim() : undefined,
    };
    if (!normalized.isHome) warnings.push("This row does not look like a Whitehouse home event.");
    const key = duplicateEventKey({ normalized });
    if (key && seen.has(key)) warnings.push("Possible duplicate event in this import.");
    if (key) seen.add(key);
    return { rowNumber: index + 2, raw: row, normalized, duplicateKey: key, errors, warnings };
  });
}

export function parseWorkbook(buffer: Buffer, filename: string) {
  const ext = filename.split(".").pop()?.toLowerCase();
  if (!ext || !["xlsx", "xls", "csv"].includes(ext)) {
    throw new Error("Unsupported file type. Upload an .xlsx, .xls, or .csv file.");
  }
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
  if (workbook.SheetNames.length === 0) throw new Error("Empty workbook.");
  if (workbook.SheetNames.length > MAX_WORKSHEETS) throw new Error(`Workbooks may contain at most ${MAX_WORKSHEETS} worksheets.`);
  return workbook.SheetNames.map((sheetName) => {
    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: "" });
    if (rows.length > MAX_ROWS_PER_WORKSHEET) throw new Error(`Each worksheet may contain at most ${MAX_ROWS_PER_WORKSHEET.toLocaleString()} rows.`);
    if (Object.keys(rows[0] ?? {}).length > MAX_COLUMNS_PER_WORKSHEET) throw new Error(`Each worksheet may contain at most ${MAX_COLUMNS_PER_WORKSHEET} columns.`);
    return {
      sheetName,
      headers: Object.keys(rows[0] ?? {}),
      rows,
      preview: previewRows(rows),
    };
  });
}
