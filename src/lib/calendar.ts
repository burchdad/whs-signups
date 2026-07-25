import type { VolunteerEvent, VolunteerSlot } from "./types";
import { appUrl } from "./utils";

function icsDate(value: string) {
  return new Date(value).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

export function googleCalendarUrl(event: VolunteerEvent, slot: VolunteerSlot) {
  const url = new URL("https://calendar.google.com/calendar/render");
  url.searchParams.set("action", "TEMPLATE");
  url.searchParams.set("text", `${event.title} - ${slot.name}`);
  url.searchParams.set("dates", `${icsDate(slot.shiftStart || event.startsAt)}/${icsDate(slot.shiftEnd || event.endsAt || event.startsAt)}`);
  url.searchParams.set("location", event.location);
  url.searchParams.set("details", `Volunteer position: ${slot.name}\n${appUrl(`/events/${event.slug}`)}`);
  return url.toString();
}

export function createIcs(event: VolunteerEvent, slot: VolunteerSlot) {
  const start = slot.shiftStart || event.startsAt;
  const end = slot.shiftEnd || event.endsAt || event.startsAt;
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//WHSSignups//Volunteer Signup//EN",
    "BEGIN:VEVENT",
    `UID:${event.id}-${slot.id}@whssignups.com`,
    `DTSTAMP:${icsDate(new Date().toISOString())}`,
    `DTSTART:${icsDate(start)}`,
    `DTEND:${icsDate(end)}`,
    `SUMMARY:${event.title} - ${slot.name}`,
    `LOCATION:${event.location}`,
    `DESCRIPTION:Volunteer position: ${slot.name}\\n${appUrl(`/events/${event.slug}`)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}
