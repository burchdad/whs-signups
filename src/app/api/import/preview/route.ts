import { NextResponse } from "next/server";
import { parseWorkbook } from "@/lib/import/parser";

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) return NextResponse.json({ message: "Upload a schedule file." }, { status: 400 });
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    return NextResponse.json({ worksheets: parseWorkbook(buffer, file.name) });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Could not parse workbook." }, { status: 400 });
  }
}
