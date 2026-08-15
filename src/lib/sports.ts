export const sportsOffered = [
  "Baseball",
  "Basketball (Boys)",
  "Basketball (Girls)",
  "Cheerleading (Girls)",
  "Cross Country (Coed)",
  "Football",
  "Soccer (Boys)",
  "Soccer (Girls)",
  "Softball",
  "Swimming and Diving (Coed)",
  "Track and Field (Boys)",
  "Track and Field (Girls)",
  "Volleyball",
] as const;

export type SportName = (typeof sportsOffered)[number];

export function sportSlug(sport: string) {
  return sport.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function sportFromSlug(slug: string) {
  const aliases: Record<string, SportName> = {
    "baseball-boys": "Baseball",
    "football-boys": "Football",
    "volleyball-girls": "Volleyball",
  };
  return aliases[slug] ?? sportsOffered.find((sport) => sportSlug(sport) === slug);
}
