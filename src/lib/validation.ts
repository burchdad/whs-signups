import { z } from "zod";
import { participationAreas } from "./sports";

export const signupSchema = z.object({
  slotId: z.string().uuid("Choose a valid volunteer position."),
  firstName: z.string().trim().min(1, "First name is required.").max(80),
  lastName: z.string().trim().min(1, "Last name is required.").max(80),
  email: z.string().trim().email("Enter a valid email address.").max(200),
  phone: z.string().trim().min(7, "Enter a phone number.").max(40),
  studentName: z.string().trim().max(120).optional().or(z.literal("")),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
  consent: z.literal("on", { error: "Please accept the volunteer signup terms." }),
  turnstileToken: z.string().optional(),
});

export type SignupInput = z.infer<typeof signupSchema>;

export const boosterClubSignupSchema = z.object({
  programId: z.string().uuid("Choose a Booster Club."),
  firstName: z.string().trim().min(1, "First name is required.").max(80),
  lastName: z.string().trim().min(1, "Last name is required.").max(80),
  email: z.string().trim().email("Enter a valid email address.").max(200),
  phone: z.string().trim().min(7, "Enter a phone number.").max(40),
  selectedSports: z.array(z.enum(participationAreas)).min(1, "Choose at least one program."),
  gearPreference: z.enum(["hat", "shirt"], { error: "Choose hat or shirt." }),
  openToVolunteering: z.enum(["yes", "no"], { error: "Choose whether you are open to volunteering." }),
  interestedInSponsoring: z.enum(["yes", "no"], { error: "Choose whether you are interested in sponsoring." }),
  consent: z.literal("on", { error: "Please accept the Booster Club signup terms." }),
  turnstileToken: z.string().optional(),
});

export type BoosterClubSignupInput = z.infer<typeof boosterClubSignupSchema>;
