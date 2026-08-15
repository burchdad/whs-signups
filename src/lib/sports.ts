export const sportsOffered = [
  "Baseball",
  "Basketball (Boys)",
  "Basketball (Girls)",
  "Cheerleading (Girls)",
  "Cross Country (Coed)",
  "Football",
  "Golf (Girls)",
  "Soccer (Boys)",
  "Soccer (Girls)",
  "Softball",
  "Swimming and Diving (Coed)",
  "Tennis (Coed)",
  "Track and Field (Boys)",
  "Track and Field (Girls)",
  "Volleyball",
  "Wrestling (Coed)",
] as const;

export type SportName = (typeof sportsOffered)[number];

export const groupPrograms = ["Band", "Choir", "Other School Club"] as const;
export const participationAreas = [...sportsOffered, ...groupPrograms] as const;
export type ParticipationArea = (typeof participationAreas)[number];

export function sportSlug(sport: string) {
  return sport.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export const sportPhotos: Partial<Record<SportName, Array<{ src: string; alt: string; label?: string }>>> = {
  Baseball: [{ src: "/sports/baseball.jpg", alt: "Whitehouse Wildcats baseball team" }],
  "Basketball (Boys)": [{ src: "/sports/basketball-boys.jpg", alt: "Whitehouse Wildcats boys basketball team" }],
  "Basketball (Girls)": [{ src: "/sports/basketball-girls.jpg", alt: "Whitehouse Ladycats basketball team" }],
  "Golf (Girls)": [{ src: "/sports/golf-girls.jpg", alt: "Whitehouse Wildcats girls golf team" }],
  "Soccer (Boys)": [{ src: "/sports/soccer-boys.jpg", alt: "Whitehouse Wildcats boys soccer team" }],
  "Soccer (Girls)": [{ src: "/sports/soccer-girls.jpg", alt: "Whitehouse Wildcats girls soccer team" }],
  Softball: [{ src: "/sports/softball.jpg", alt: "Whitehouse Wildcats softball team" }],
  "Swimming and Diving (Coed)": [{ src: "/sports/swimming-diving.jpg", alt: "Whitehouse Wildcats swimming and diving team" }],
  "Tennis (Coed)": [{ src: "/sports/tennis.jpg", alt: "Whitehouse Wildcats tennis team" }],
  Volleyball: [{ src: "/sports/volleyball.jpg", alt: "Whitehouse Ladycats volleyball team" }],
  "Wrestling (Coed)": [
    { src: "/sports/wrestling-boys.jpg", alt: "Whitehouse Wildcats boys wrestling team", label: "Boys" },
    { src: "/sports/wrestling-girls.jpg", alt: "Whitehouse Wildcats girls wrestling team", label: "Girls" },
  ],
};

export function sportFromSlug(slug: string) {
  const aliases: Record<string, SportName> = {
    "baseball-boys": "Baseball",
    "football-boys": "Football",
    "volleyball-girls": "Volleyball",
  };
  return aliases[slug] ?? sportsOffered.find((sport) => sportSlug(sport) === slug);
}
