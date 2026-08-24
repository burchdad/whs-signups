import type { Signup, VolunteerEvent, VolunteerTemplate } from "./types";

export const organization = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "Whitehouse High School",
  city: "Whitehouse",
  state: "Texas",
  contactEmail: "volunteers@whssignups.com",
};

export const templates: VolunteerTemplate[] = [
  {
    id: "22222222-2222-4222-8222-222222222223",
    name: "WHS Volleyball Game Volunteers",
    description: "Every home event needs six student volunteers and two adult volunteers.",
    slots: [
      { name: "Student Volunteer", category: "Student Volunteers", capacity: 6, sortOrder: 1 },
      { name: "Adult Volunteer", category: "Adult Volunteers", capacity: 2, sortOrder: 2 },
    ],
  },
];

type EventSeed = {
  idSuffix: string;
  date: string;
  start: string;
  end: string;
  title: string;
  slug: string;
  opponent?: string;
  eventType: string;
  description?: string;
  ninth: string;
  jv: string;
  varsity: string;
};

const eventSeeds: EventSeed[] = [
  { idSuffix: "401", date: "2026-08-07", start: "09:00", end: "13:30", title: "Home Scrimmage - Carthage, Bullard & Lindale", slug: "home-scrimmage-carthage-bullard-lindale-2026-08-07", eventType: "Scrimmage", description: "Home scrimmage", ninth: "09:00", jv: "09:00", varsity: "09:00" },
  { idSuffix: "402", date: "2026-08-08", start: "09:00", end: "13:30", title: "Home Scrimmage - PT, Bullard & Tyler", slug: "home-scrimmage-pt-bullard-tyler-2026-08-08", eventType: "Scrimmage", description: "Home scrimmage", ninth: "09:00", jv: "09:00", varsity: "09:00" },
  { idSuffix: "403", date: "2026-09-01", start: "17:00", end: "19:30", title: "Whitehouse vs. Lufkin", slug: "whitehouse-vs-lufkin-2026-09-01", opponent: "Lufkin", eventType: "Home Game", ninth: "17:00", jv: "17:00", varsity: "18:00" },
  { idSuffix: "404", date: "2026-09-03", start: "08:00", end: "18:00", title: "Whitehouse Volleyball Tournament - Day 1", slug: "whitehouse-volleyball-tournament-day-1-2026-09-03", eventType: "Tournament", description: "Varsity tournament; ending time not listed", ninth: "08:00", jv: "08:00", varsity: "09:00" },
  { idSuffix: "405", date: "2026-09-05", start: "08:00", end: "18:00", title: "Whitehouse Volleyball Tournament - Day 2", slug: "whitehouse-volleyball-tournament-day-2-2026-09-05", eventType: "Tournament", description: "Varsity tournament; ending time not listed", ninth: "08:00", jv: "08:00", varsity: "09:00" },
  { idSuffix: "406", date: "2026-09-04", start: "16:30", end: "19:00", title: "Whitehouse vs. Van", slug: "whitehouse-vs-van-2026-09-04", opponent: "Van", eventType: "Home Game", ninth: "17:30", jv: "17:30", varsity: "16:30" },
  { idSuffix: "407", date: "2026-09-08", start: "17:00", end: "19:30", title: "Whitehouse vs. Hallsville", slug: "whitehouse-vs-hallsville-2026-09-08", opponent: "Hallsville", eventType: "Home Game", ninth: "17:00", jv: "17:00", varsity: "18:00" },
  { idSuffix: "408", date: "2026-09-18", start: "16:30", end: "19:00", title: "Whitehouse vs. Mt. Pleasant", slug: "whitehouse-vs-mt-pleasant-2026-09-18", opponent: "Mt. Pleasant", eventType: "Home Game", ninth: "17:30", jv: "17:30", varsity: "16:30" },
  { idSuffix: "409", date: "2026-10-06", start: "17:00", end: "19:30", title: "Whitehouse vs. Marshall", slug: "whitehouse-vs-marshall-2026-10-06", opponent: "Marshall", eventType: "Home Game", ninth: "17:00", jv: "17:00", varsity: "18:00" },
  { idSuffix: "410", date: "2026-10-09", start: "16:30", end: "19:00", title: "Whitehouse vs. Tyler High", slug: "whitehouse-vs-tyler-high-2026-10-09", opponent: "Tyler High", eventType: "Home Game", ninth: "17:30", jv: "17:30", varsity: "16:30" },
  { idSuffix: "411", date: "2026-10-16", start: "16:30", end: "19:00", title: "Whitehouse vs. Texas High", slug: "whitehouse-vs-texas-high-2026-10-16", opponent: "Texas High", eventType: "Home Game", ninth: "17:30", jv: "17:30", varsity: "16:30" },
  { idSuffix: "412", date: "2026-10-20", start: "17:00", end: "19:30", title: "Whitehouse vs. Nacogdoches", slug: "whitehouse-vs-nacogdoches-2026-10-20", opponent: "Nacogdoches", eventType: "Home Game", ninth: "17:00", jv: "17:00", varsity: "18:00" },
];

export const events: VolunteerEvent[] = eventSeeds.map((seed, index) => {
  const eventId = `33333333-3333-4333-8333-333333333${seed.idSuffix}`;
  return {
    id: eventId,
    organizationId: organization.id,
    sport: "Volleyball",
    season: "2026",
    title: seed.title,
    slug: seed.slug,
    opponent: seed.opponent,
    eventType: seed.eventType,
    eventDate: seed.date,
    startsAt: centralIso(seed.date, seed.start),
    endsAt: centralIso(seed.date, seed.end),
    location: "Whitehouse High School",
    address: "901 E Main St, Whitehouse, TX 75791",
    description: seed.description,
    homeAway: "home",
    isPublished: true,
    contactName: "WHS Volleyball Booster Club",
    contactEmail: organization.contactEmail,
    isArchived: false,
    schedule: [
      { id: scheduleId(index, 1), label: "9th Grade", startsAt: centralIso(seed.date, seed.ninth), sortOrder: 1 },
      { id: scheduleId(index, 2), label: "JV", startsAt: centralIso(seed.date, seed.jv), sortOrder: 2 },
      { id: scheduleId(index, 3), label: "Varsity", startsAt: centralIso(seed.date, seed.varsity), sortOrder: 3 },
    ],
    slots: [
      { id: slotId(index, 1), eventId, name: "Student Volunteer - 9th Grade", category: "Student Volunteers", shiftStart: centralIso(seed.date, seed.ninth, -30), shiftEnd: centralIso(seed.date, seed.ninth, 60), capacity: 6, filled: 0, isOpen: true, isVisible: true, sortOrder: 1, instructions: "Student shift begins 30 minutes before the listed game time and runs 1.5 hours." },
      { id: slotId(index, 2), eventId, name: "Student Volunteer - JV", category: "Student Volunteers", shiftStart: centralIso(seed.date, seed.jv, -30), shiftEnd: centralIso(seed.date, seed.jv, 60), capacity: 6, filled: 0, isOpen: true, isVisible: true, sortOrder: 2, instructions: "Student shift begins 30 minutes before the listed game time and runs 1.5 hours." },
      { id: slotId(index, 3), eventId, name: "Student Volunteer - Varsity", category: "Student Volunteers", shiftStart: centralIso(seed.date, seed.varsity, -30), shiftEnd: centralIso(seed.date, seed.varsity, 60), capacity: 6, filled: 0, isOpen: true, isVisible: true, sortOrder: 3, instructions: "Student shift begins 30 minutes before the listed game time and runs 1.5 hours." },
      { id: slotId(index, 9), eventId, name: "Adult Volunteer", category: "Adult Volunteers", shiftStart: centralIso(seed.date, seed.start), shiftEnd: centralIso(seed.date, seed.end), capacity: 2, filled: 0, isOpen: true, isVisible: true, sortOrder: 100 },
    ],
  };
});

export const sampleSignups: Signup[] = [];

function centralIso(date: string, time: string, offsetMinutes = 0) {
  const value = new Date(`${date}T${time}:00-05:00`);
  value.setMinutes(value.getMinutes() + offsetMinutes);
  return value.toISOString();
}

function scheduleId(eventIndex: number, order: number) {
  return `44444444-4444-4444-8444-${(444444444400 + eventIndex * 10 + order).toString()}`;
}

function slotId(eventIndex: number, order: number) {
  return `55555555-5555-4555-8555-${(555555555500 + eventIndex * 10 + order).toString()}`;
}
