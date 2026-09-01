"use server";

import { redirect } from "next/navigation";
import { acceptAdminInvite } from "@/lib/admin-access";

export async function setInvitedAdminPassword(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  if (password !== String(formData.get("confirmPassword") ?? "")) throw new Error("The passwords do not match.");
  await acceptAdminInvite({ token, newPassword: password });
  redirect("/admin/login?invited=1");
}
