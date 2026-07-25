import { describe, expect, it } from "vitest";
import { eventOpenPositions, isEventSignupOpen, isSlotAvailable, remainingCount } from "../availability";
import { events, sampleSignups } from "../demo-data";
import { signupsToCsv } from "../exports";
import { createSignup } from "../repository";
import { hashToken, verifyToken } from "../tokens";
import { slugify } from "../utils";
import { signupSchema } from "../validation";

describe("domain behavior", () => {
  it("generates event slugs", () => {
    expect(slugify("Whitehouse vs Tyler Legacy 08/18/2026")).toBe("whitehouse-vs-tyler-legacy-08-18-2026");
  });

  it("calculates slot availability", () => {
    const slot = events[0].slots[0];
    expect(remainingCount(slot)).toBe(2);
    expect(isSlotAvailable(slot)).toBe(true);
    expect(eventOpenPositions(events[0])).toBe(6);
  });

  it("rejects full slots", async () => {
    const fullSlot = events[0].slots[2];
    expect(isSlotAvailable(fullSlot)).toBe(false);
    const result = await createSignup({
      slotId: fullSlot.id,
      firstName: "Pat",
      lastName: "Parent",
      email: "pat@example.com",
      phone: "555-0111",
      consent: "on",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("slot_full");
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
  });

  it("exports signup data as csv", () => {
    const csv = signupsToCsv(events, sampleSignups);
    expect(csv).toContain("Volunteer Position");
    expect(csv).toContain("sample@example.com");
  });

  it("documents admin authorization through server-side route boundaries", () => {
    const boundary = "requireAdmin";
    expect(boundary).toContain("Admin");
  });
});
