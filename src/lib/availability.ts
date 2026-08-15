import type { VolunteerEvent, VolunteerSlot } from "./types";

export function filledCount(slot: VolunteerSlot) {
  return Math.max(0, slot.filled);
}

export function remainingCount(slot: VolunteerSlot) {
  return Math.max(0, slot.capacity - filledCount(slot));
}

export function isSlotAvailable(slot: VolunteerSlot) {
  return slot.isOpen && slot.isVisible && remainingCount(slot) > 0;
}

export function isEventSignupOpen(event: VolunteerEvent, now = new Date()) {
  if (!event.isPublished || event.isArchived) return false;
  const eventStart = new Date(event.startsAt);
  if (eventStart < now) return false;
  if (event.signupOpensAt && new Date(event.signupOpensAt) > now) return false;
  if (event.signupClosesAt && new Date(event.signupClosesAt) < now) return false;
  return true;
}

export function eventOpenPositions(event: VolunteerEvent, now = new Date()) {
  if (!isEventSignupOpen(event, now)) return 0;
  return event.slots.reduce((sum, slot) => sum + (slot.isOpen && slot.isVisible ? remainingCount(slot) : 0), 0);
}

export function eventStatus(event: VolunteerEvent, now = new Date()): "open" | "full" | "closed" | "draft" {
  if (!event.isPublished) return "draft";
  if (!isEventSignupOpen(event, now)) return "closed";
  return eventOpenPositions(event, now) > 0 ? "open" : "full";
}
