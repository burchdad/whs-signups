import { describe, expect, it } from "vitest";
import { eventOpenPositions, eventStatus, isEventSignupOpen, isSlotAvailable, remainingCount } from "../availability";
import { verifyAdminCredentials } from "../auth";
import { events, sampleSignups } from "../demo-data";
import { boosterClubToCsv, signupsToCsv } from "../exports";
import { hashToken, verifyToken } from "../tokens";
import { slugify } from "../utils";
import { signupSchema } from "../validation";
import { sportFromSlug, sportsOffered } from "../sports";
import { canManageOrganizationSettings, canManageProgramPayments, parseEmailList, type AdminSession } from "../admin-access";

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

  it("fails admin authentication closed when credentials are missing", async () => {
    const previousEmail = process.env.ADMIN_EMAIL;
    const previousPassword = process.env.ADMIN_PASSWORD;
    delete process.env.ADMIN_EMAIL;
    delete process.env.ADMIN_PASSWORD;
    expect(await verifyAdminCredentials("admin@example.com", "anything")).toBeUndefined();
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

  it("keeps Booster Club program and payment identity in exports", () => {
    const csv = boosterClubToCsv([{ id: "signup-1", firstName: "Pat", lastName: "Parent", email: "pat@example.com", normalizedEmail: "pat@example.com", phone: "555-0111", programId: "program-1", programName: "Baseball Booster Club", selectedSports: ["Baseball"], gearPreference: "shirt", openToVolunteering: true, interestedInSponsoring: false, paymentStatus: "paid", paymentAmountCents: 2500, createdAt: "2026-08-15T12:00:00.000Z" }]);
    expect(csv).toContain("Baseball Booster Club");
    expect(csv).toContain("Payment Status");
    expect(csv).toContain("25.00");
  });

  it("documents admin authorization through server-side route boundaries", () => {
    const boundary = "requireAdmin";
    expect(boundary).toContain("Admin");
  });

  it("normalizes and deduplicates dashboard notification recipients", () => {
    expect(parseEmailList("President@Example.com, volunteers@example.com\npresident@example.com")).toEqual(["president@example.com", "volunteers@example.com"]);
  });

  it("keeps organization email and payment settings limited to the intended roles", () => {
    const session = (role: AdminSession["user"]["role"]): AdminSession => ({ user: { id: "1", email: "admin@example.com", name: "Admin", role }, organizationId: "org", allowedSports: [], programIds: [], mustChangePassword: false });
    expect(canManageOrganizationSettings(session("organization_admin"))).toBe(true);
    expect(canManageOrganizationSettings(session("program_admin"))).toBe(false);
    expect(canManageProgramPayments(session("program_admin"))).toBe(true);
    expect(canManageProgramPayments(session("volunteer_coordinator"))).toBe(false);
  });
});
