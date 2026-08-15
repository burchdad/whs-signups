import { permanentRedirect } from "next/navigation";
import { sportFromSlug, sportSlug, sportsOffered } from "@/lib/sports";

export function generateStaticParams() {
  return sportsOffered.map((sport) => ({ slug: sport.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") }));
}

export default async function SportPage({ params }: { params: Promise<{ slug: string }> }) {
  const sport = sportFromSlug((await params).slug);
  permanentRedirect(sport ? `/${sportSlug(sport)}` : "/");
}
