export type SignupStatus = "confirmed" | "cancelled" | "waitlisted" | "removed";

export type EventStatus = "open" | "full" | "closed" | "draft";

export type EventScheduleItem = {
  id: string;
  label: string;
  startsAt: string;
  sortOrder: number;
};

export type VolunteerSlot = {
  id: string;
  eventId: string;
  name: string;
  description?: string;
  category: string;
  shiftStart?: string;
  shiftEnd?: string;
  capacity: number;
  filled: number;
  isOpen: boolean;
  isVisible: boolean;
  sortOrder: number;
  instructions?: string;
};

export type Signup = {
  id: string;
  organizationId: string;
  eventId: string;
  slotId: string;
  firstName: string;
  lastName: string;
  email: string;
  normalizedEmail: string;
  phone: string;
  studentName?: string;
  notes?: string;
  status: SignupStatus;
  cancellationTokenHash: string;
  createdAt: string;
  cancelledAt?: string;
};

export type VolunteerEvent = {
  id: string;
  organizationId: string;
  sport: string;
  season: string;
  title: string;
  slug: string;
  opponent?: string;
  eventType: string;
  eventDate: string;
  startsAt: string;
  endsAt?: string;
  location: string;
  address?: string;
  description?: string;
  homeAway: "home" | "away" | "neutral";
  isPublished: boolean;
  signupOpensAt?: string;
  signupClosesAt?: string;
  contactName?: string;
  contactEmail?: string;
  isArchived: boolean;
  schedule: EventScheduleItem[];
  slots: VolunteerSlot[];
};

export type VolunteerTemplate = {
  id: string;
  name: string;
  description: string;
  slots: Array<Pick<VolunteerSlot, "name" | "category" | "capacity" | "sortOrder">>;
};

export type AdminSignupRow = Signup & {
  eventTitle: string;
  eventDate: string;
  slotName: string;
};

export type BoosterClubSignup = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  normalizedEmail: string;
  phone: string;
  programId: string;
  programName: string;
  selectedSports: string[];
  gearPreference: "hat" | "shirt";
  openToVolunteering: boolean;
  interestedInSponsoring: boolean;
  paymentStatus: "not_required" | "pending" | "paid" | "failed" | "refunded";
  paymentAmountCents: number;
  createdAt: string;
};

export type BoosterProgram = {
  id: string;
  name: string;
  sports: string[];
  membershipFeeCents: number;
  paymentRequired: boolean;
  stripeAccountId?: string;
  stripeChargesEnabled: boolean;
};
