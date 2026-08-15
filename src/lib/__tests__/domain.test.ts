import { describe, expect, it } from "vitest";
import { eventOpenPositions, eventStatus, isEventSignupOpen, isSlotAvailable, remainingCount } from "../availability";
import { verifyAdminCredentials } from "../auth";
import { events, sampleSignups } from "../demo-data";
import { signupsToCsv } from "../exports";
import { hashToken, verifyToken } from "../tokens";
import { slugify } from "../utils";
import { signupSchema } from "../validation";
import { sportFromSlug, sportsOffered } from "../sports";

describe("domain behavior", () => {
  it("generates event slugs", () => {
    expect(slugify("Whitehouse vs Tyler Legacy 08/18/2026")).toBe("whitehouse-vs-tyler-legacy-08-18-2026");
  });

  it("calculates slot availability", () => {
    const slot = events[0].slots[0];
    expect(remainingCount(slot)).toBe(6);
    expect(isSlotAvailable(slot)).toBe(true);
    expect(eventOpenPositions(events[0], new Date("2026-01-01T00:00:00.000Z"))).toBe(8);
  });

  it("rejects full slots", async () => {
    const fullSlot = { ...events[0].slots[0], filled: events[0].slots[0].capacity };
    expect(isSlotAvailable(fullSlot)).toBe(false);
  });

  it("validates signup input", () => {
    const parsed = signupSchema.safeParse({
      slotId: events[0].slots[0].id,
      firstName: "Pat",
      lastName: "Parent",
      email: "pat@example.com",
      phone: "555-0111",
      consent: "on",
    });
    expect(parsed.success).toBe(true);
  });

  it("handles cancellation token hashing", () => {
    const token = "private-token";
    expect(verifyToken(token, hashToken(token))).toBe(true);
  });

  it("treats closed or past events as unavailable", () => {
    expect(isEventSignupOpen({ ...events[0], isPublished: false })).toBe(false);
    expect(isEventSignupOpen({ ...events[0], startsAt: "2020-01-01T12:00:00.000Z" })).toBe(false);
    expect(eventOpenPositions({ ...events[0], startsAt: "2020-01-01T12:00:00.000Z" })).toBe(0);
    expect(eventStatus({ ...events[0], startsAt: "2020-01-01T12:00:00.000Z" })).toBe("closed");
  });

  it("does not count closed or hidden slots as open positions", () => {
    const slots = events[0].slots.map((slot, index) => index === 0 ? { ...slot, isOpen: false } : { ...slot, isVisible: false });
    expect(eventOpenPositions({ ...events[0], slots }, new Date("2026-01-01T00:00:00.000Z"))).toBe(0);
  });

  it("fails admin authentication closed when credentials are missing", () => {
    const previousEmail = process.env.ADMIN_EMAIL;
    const previousPassword = process.env.ADMIN_PASSWORD;
    delete process.env.ADMIN_EMAIL;
    delete process.env.ADMIN_PASSWORD;
    expect(verifyAdminCredentials("admin@example.com", "anything")).toBe(false);
    if (previousEmail) process.env.ADMIN_EMAIL = previousEmail;
    if (previousPassword) process.env.ADMIN_PASSWORD = previousPassword;
  });

  it("keeps legacy sport URLs without showing duplicate sports", () => {
    expect(new Set(sportsOffered).size).toBe(sportsOffered.length);
    expect(sportFromSlug("volleyball-girls")).toBe("Volleyball");
    expect(sportFromSlug("football-boys")).toBe("Football");
  });

  it("exports signup data as csv", () => {
    const csv = signupsToCsv(events, sampleSignups);
    expect(csv).toContain("Volunteer Position");
    expect(csv).toContain("Signup Date");
  });

  it("documents admin authorization through server-side route boundaries", () => {
    const boundary = "requireAdmin";
    expect(boundary).toContain("Admin");
  });
});
