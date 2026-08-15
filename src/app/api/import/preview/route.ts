import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { parseWorkbook } from "@/lib/import/parser";

const MAX_IMPORT_BYTES = 5 * 1024 * 1024;

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > MAX_IMPORT_BYTES) return NextResponse.json({ message: "Import files must be 5 MB or smaller." }, { status: 413 });
  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) return NextResponse.json({ message: "Upload a schedule file." }, { status: 400 });
  if (file.size > MAX_IMPORT_BYTES) return NextResponse.json({ message: "Import files must be 5 MB or smaller." }, { status: 413 });
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    return NextResponse.json({ worksheets: parseWorkbook(buffer, file.name) });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Could not parse workbook." }, { status: 400 });
  }
}
