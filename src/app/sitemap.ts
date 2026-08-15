import type { MetadataRoute } from "next";
import { listPublicEvents } from "@/lib/repository";
import { appUrl } from "@/lib/utils";
import { sportSlug, sportsOffered } from "@/lib/sports";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const events = await listPublicEvents();
  return [
    "", "/events", "/booster-club", "/privacy", "/terms", "/contact",
    ...sportsOffered.map((sport) => `/${sportSlug(sport)}`),
    ...events.map((event) => `/events/${event.slug}`),
  ].map((path) => ({ url: appUrl(path), lastModified: new Date() }));
}
