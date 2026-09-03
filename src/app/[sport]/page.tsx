import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BrandHeader } from "@/components/brand-header";
import { EventCard } from "@/components/event-card";
import { SportPhoto } from "@/components/sport-photo";
import { getSportPhotoMap, listPublicEvents } from "@/lib/repository";
import { appUrl } from "@/lib/utils";
import { publicSportsOffered, sportFromSlug, sportSlug } from "@/lib/sports";

export function generateStaticParams() {
  return publicSportsOffered.map((sport) => ({ sport: sportSlug(sport) }));
}

export async function generateMetadata({ params }: { params: Promise<{ sport: string }> }): Promise<Metadata> {
  const sport = sportFromSlug((await params).sport);
  if (!sport) return { title: "Sport Signups" };
  const slug = sportSlug(sport);
  const photoMap = await getSportPhotoMap();
  const photo = photoMap[sport]?.[0];
  const title = `${sport} Signups`;
  const description = `Volunteer events and Booster Club interest for Whitehouse ${sport}.`;
  const url = appUrl(`/${slug}`);
  const imageUrl = appUrl(photo?.src ?? "/brand/whs-logo.png");
  const imageAlt = photo?.alt ?? `Whitehouse Wildcats ${sport} signups`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: `${title} | WHSSignups`,
      description,
      url,
      siteName: "WHSSignups",
      type: "website",
      images: [{ url: imageUrl, alt: imageAlt }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | WHSSignups`,
      description,
      images: [imageUrl],
    },
  };
}

export default async function SportPage({ params }: { params: Promise<{ sport: string }> }) {
  const sport = sportFromSlug((await params).sport);
  if (!sport) notFound();
  const now = new Date();
  const [publicEvents, photoMap] = await Promise.all([listPublicEvents(), getSportPhotoMap()]);
  const events = publicEvents
    .filter((event) => event.sport === sport && new Date(event.startsAt) >= now)
    .toSorted((left, right) => new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime());
  return (
    <>
      <BrandHeader />
      <main className="container py-8">
        <section className="overflow-hidden rounded-sm bg-[var(--maroon-dark)] text-white">
          {photoMap[sport] && <SportPhoto images={photoMap[sport]} eager />}
          <div className="athletic-band p-6 sm:p-8">
            <p className="eyebrow">Whitehouse Wildcats</p>
            <h1 className="mt-2 text-4xl font-black uppercase leading-none tracking-tight">{sport}</h1>
            <p className="mt-3 font-medium text-white/82">Volunteer events and Booster Club interest for {sport}.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href={`/events?sport=${encodeURIComponent(sport)}`} className="inline-flex min-h-11 items-center rounded-sm bg-[var(--gold)] px-4 font-black uppercase tracking-wide text-black">View events</Link>
              <Link href={`/booster-club?sport=${encodeURIComponent(sport)}`} className="inline-flex min-h-11 items-center rounded-sm border border-[var(--gold)] px-4 font-black uppercase tracking-wide text-[var(--gold)]">Join Booster Club</Link>
            </div>
          </div>
        </section>
        {events.length > 0 ? <div className="mt-6 grid gap-4 md:grid-cols-2">{events.map((event) => <EventCard key={event.id} event={event} />)}</div> : (
          <section className="wildcat-card mt-6 rounded-sm p-6">
            <p className="eyebrow text-[var(--maroon)]">No events posted</p>
            <h2 className="mt-2 text-2xl font-black uppercase text-[var(--ink)]">Booster Club interest is open now.</h2>
            <p className="mt-2 font-medium text-[var(--muted)]">This sport page is ready for schedules as they are added.</p>
          </section>
        )}
      </main>
    </>
  );
}
