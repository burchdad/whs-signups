export const sportsOffered = [
  "Baseball",
  "Baseball (Boys)",
  "Basketball (Boys)",
  "Basketball (Girls)",
  "Cheerleading (Girls)",
  "Cross Country (Coed)",
  "Football (Boys)",
  "Football",
  "Soccer (Boys)",
  "Soccer (Girls)",
  "Softball",
  "Swimming and Diving (Coed)",
  "Track and Field (Boys)",
  "Track and Field (Girls)",
  "Volleyball",
  "Volleyball (Girls)",
] as const;

export type SportName = (typeof sportsOffered)[number];

export function sportSlug(sport: string) {
  return sport.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function sportFromSlug(slug: string) {
  return sportsOffered.find((sport) => sportSlug(sport) === slug);
}
