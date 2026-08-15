import { NextResponse } from "next/server";
import { getSportPhotoFile } from "@/lib/repository";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const photo = await getSportPhotoFile((await params).id);
  if (!photo) return NextResponse.json({ message: "Photo not found." }, { status: 404 });
  return new NextResponse(new Uint8Array(photo.bytes), {
    headers: {
      "Content-Type": photo.mimeType,
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      "Last-Modified": new Date(photo.updatedAt).toUTCString(),
    },
  });
}
