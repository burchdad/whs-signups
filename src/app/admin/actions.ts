"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { cancelSignupById, createAdminEvent, updateEventDetails, updateSlotState } from "@/lib/repository";

export async function saveEventDetails(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  await updateEventDetails({
    id,
    title: String(formData.get("title") ?? ""),
    opponent: String(formData.get("opponent") ?? ""),
    eventDate: String(formData.get("eventDate") ?? ""),
    startsAt: String(formData.get("startsAt") ?? ""),
    location: String(formData.get("location") ?? ""),
    description: String(formData.get("description") ?? ""),
  });
  revalidatePath("/admin");
  revalidatePath("/admin/events");
  revalidatePath(`/admin/events/${id}`);
}

export async function setSlotOpen(formData: FormData) {
  await requireAdmin();
  const eventId = String(formData.get("eventId") ?? "");
  await updateSlotState({ slotId: String(formData.get("slotId") ?? ""), isOpen: String(formData.get("isOpen")) === "true" });
  revalidatePath("/admin");
  revalidatePath("/admin/events");
  revalidatePath(`/admin/events/${eventId}`);
}

export async function cancelSignup(formData: FormData) {
  await requireAdmin();
  await cancelSignupById(String(formData.get("signupId") ?? ""));
  revalidatePath("/admin");
  revalidatePath("/admin/signups");
}

export async function createEvent(formData: FormData) {
  await requireAdmin();
  await createAdminEvent({
    title: String(formData.get("title") ?? ""),
    sport: String(formData.get("sport") ?? "Volleyball"),
    opponent: String(formData.get("opponent") ?? ""),
    eventDate: String(formData.get("eventDate") ?? ""),
    startsAt: String(formData.get("startsAt") ?? ""),
    location: String(formData.get("location") ?? ""),
    description: String(formData.get("description") ?? ""),
  });
  revalidatePath("/admin");
  revalidatePath("/admin/events");
  redirect("/admin/events");
}
