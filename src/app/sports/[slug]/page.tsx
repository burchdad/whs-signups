import { permanentRedirect } from "next/navigation";
import { publicSportsOffered, sportFromSlug, sportSlug } from "@/lib/sports";

export function generateStaticParams() {
  return publicSportsOffered.map((sport) => ({ slug: sportSlug(sport) }));
}

export default async function SportPage({ params }: { params: Promise<{ slug: string }> }) {
  const sport = sportFromSlug((await params).slug);
  permanentRedirect(sport ? `/${sportSlug(sport)}` : "/");
}
