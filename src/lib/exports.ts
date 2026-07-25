import type { AdminSignupRow, BoosterClubSignup, Signup, VolunteerEvent } from "./types";

function csvCell(value: unknown) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function signupsToCsv(events: VolunteerEvent[], signups: Signup[]) {
  const rows = [
    [
      "Event Date",
      "Event",
      "Opponent",
      "Location",
      "Volunteer Position",
      "Shift Time",
      "Volunteer Name",
      "Email",
      "Phone",
      "Student/Player",
      "Status",
      "Signup Date",
      "Notes",
    ],
  ];
  for (const signup of signups) {
    const event = events.find((candidate) => candidate.id === signup.eventId);
    const slot = event?.slots.find((candidate) => candidate.id === signup.slotId);
    rows.push([
      event?.eventDate ?? "",
      event?.title ?? "",
      event?.opponent ?? "",
      event?.location ?? "",
      slot?.name ?? "",
      [slot?.shiftStart, slot?.shiftEnd].filter(Boolean).join(" - "),
      `${signup.firstName} ${signup.lastName}`,
      signup.email,
      signup.phone,
      signup.studentName ?? "",
      signup.status,
      signup.createdAt,
      signup.notes ?? "",
    ]);
  }
  return rows.map((row) => row.map(csvCell).join(",")).join("\n");
}

export function adminSignupsToCsv(signups: AdminSignupRow[]) {
  const rows = [["Event Date", "Event", "Volunteer Position", "Volunteer Name", "Email", "Phone", "Status", "Signup Date", "Notes"]];
  for (const signup of signups) {
    rows.push([
      signup.eventDate,
      signup.eventTitle,
      signup.slotName,
      `${signup.firstName} ${signup.lastName}`,
      signup.email,
      signup.phone,
      signup.status,
      signup.createdAt,
      signup.notes ?? "",
    ]);
  }
  return rows.map((row) => row.map(csvCell).join(",")).join("\n");
}

export function boosterClubToCsv(signups: BoosterClubSignup[]) {
  const rows = [["Name", "Email", "Phone", "Sports", "Item", "Open To Volunteering", "Interested In Sponsoring", "Signup Date"]];
  for (const signup of signups) {
    rows.push([
      `${signup.firstName} ${signup.lastName}`,
      signup.email,
      signup.phone,
      signup.selectedSports.join("; "),
      signup.gearPreference,
      signup.openToVolunteering ? "Yes" : "No",
      signup.interestedInSponsoring ? "Yes" : "No",
      signup.createdAt,
    ]);
  }
  return rows.map((row) => row.map(csvCell).join(",")).join("\n");
}
