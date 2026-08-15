import Image from "next/image";
import { requireAdmin } from "@/lib/auth";
import { getSportPhotoMap } from "@/lib/repository";
import { sportsOffered } from "@/lib/sports";
import { uploadSportPhoto } from "../actions";

export const metadata = { title: "Team Photos" };
export const dynamic = "force-dynamic";

export default async function TeamPhotosPage({ searchParams }: { searchParams: Promise<{ uploaded?: string }> }) {
  const session = await requireAdmin();
  const photos = await getSportPhotoMap();
  const uploaded = (await searchParams).uploaded === "1";
  return (
    <>
      <p className="eyebrow">Public sport imagery</p>
      <h1 className="text-3xl font-black uppercase text-[var(--ink)]">Team photos</h1>
      <p className="mt-2 max-w-3xl font-medium text-[var(--muted)]">Upload a JPEG, PNG, or WebP up to 5 MB. A new upload replaces the current photo for that sport. Wrestling keeps separate Boys and Girls images.</p>
      {uploaded && <p role="status" className="mt-5 rounded-sm bg-[#f1fbf3] p-3 font-black text-[#225c2d]">Team photo updated.</p>}
      <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {sportsOffered.filter((sport) => session.allowedSports === null || session.allowedSports.includes(sport)).map((sport) => (
          <section key={sport} className="wildcat-card overflow-hidden rounded-sm">
            <div className="relative aspect-[16/9] bg-[var(--maroon-dark)]">
              {photos[sport]?.[0] ? <Image src={photos[sport][0].src} alt={photos[sport][0].alt} fill sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw" className="object-cover" /> : <div className="grid h-full place-items-center font-black uppercase text-[var(--gold)]">No photo yet</div>}
            </div>
            <form action={uploadSportPhoto} className="grid gap-3 p-4">
              <input type="hidden" name="sport" value={sport} />
              <h2 className="text-lg font-black uppercase text-[var(--ink)]">{sport}</h2>
              {sport === "Wrestling (Coed)" && <label className="grid gap-1"><span className="text-sm font-black uppercase">Team</span><select name="label" className="field"><option>Boys</option><option>Girls</option></select></label>}
              <input name="photo" type="file" accept="image/jpeg,image/png,image/webp" className="field" required />
              <button className="min-h-11 rounded-sm bg-[var(--maroon)] px-4 font-black uppercase tracking-wide text-white">Upload photo</button>
            </form>
          </section>
        ))}
      </div>
    </>
  );
}
