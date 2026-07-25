import type { Signup, VolunteerEvent } from "./types";

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
