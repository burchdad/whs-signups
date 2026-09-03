import { describe, expect, it } from "vitest";
import { adminSignupFilterQuery, filterAdminSignups, parseAdminSignupFilters } from "../admin-signup-filters";
import type { AdminSignupRow } from "../types";

const signups = [
  { id: "1", eventId: "event-1", slotId: "slot-1", firstName: "George", lastName: "Mungin", email: "g@example.com", phone: "9035550001", status: "confirmed", createdAt: "2026-09-01T12:00:00Z", eventTitle: "Tournament Day 2", eventDate: "2026-09-05", slotName: "Adult Volunteer", sport: "Volleyball" },
  { id: "2", eventId: "event-2", slotId: "slot-2", firstName: "Jamie", lastName: "Smith", email: "j@example.com", phone: "9035550002", status: "waitlisted", createdAt: "2026-09-02T12:00:00Z", eventTitle: "Choir Concert", eventDate: "2026-10-01", slotName: "Ticket Table", sport: "Choir" },
] as AdminSignupRow[];

describe("admin signup filters", () => {
  it("combines search, program, status, and event-date filters", () => {
    const filters = parseAdminSignupFilters(new URLSearchParams("q=George&sport=Volleyball&status=confirmed&from=2026-09-01&to=2026-09-30"));
    expect(filterAdminSignups(signups, filters).map((signup) => signup.id)).toEqual(["1"]);
  });

  it("round-trips active filters into an export query", () => {
    const filters = parseAdminSignupFilters({ event: ["event-1", "event-2"], position: "Ticket Table" });
    expect(new URLSearchParams(adminSignupFilterQuery(filters)).getAll("event")).toEqual(["event-1", "event-2"]);
    expect(filterAdminSignups(signups, filters).map((signup) => signup.id)).toEqual(["2"]);
  });

  it("matches any selected value within each filter category", () => {
    const filters = parseAdminSignupFilters(new URLSearchParams("sport=Volleyball&sport=Choir&status=confirmed&status=waitlisted"));
    expect(filterAdminSignups(signups, filters).map((signup) => signup.id)).toEqual(["1", "2"]);
  });

  it("sorts marked columns in either direction and preserves the sort query", () => {
    const ascending = parseAdminSignupFilters(new URLSearchParams("sort=volunteer&direction=asc"));
    const descending = parseAdminSignupFilters(new URLSearchParams("sort=eventDate&direction=desc"));
    expect(filterAdminSignups(signups, ascending).map((signup) => signup.id)).toEqual(["1", "2"]);
    expect(filterAdminSignups(signups, descending).map((signup) => signup.id)).toEqual(["2", "1"]);
    expect(adminSignupFilterQuery(descending)).toContain("sort=eventDate&direction=desc");
  });
});
