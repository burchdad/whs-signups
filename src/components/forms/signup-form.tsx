"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { signupSchema, type SignupInput } from "@/lib/validation";

export function SignupForm({ slotId }: { slotId: string }) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: { slotId, consent: undefined },
  });

  async function onSubmit(values: SignupInput) {
    setFormError(null);
    const response = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const payload = await response.json();
    if (!response.ok) {
      setFormError(payload.message ?? "We could not complete the signup.");
      return;
    }
    router.push(`/signup/confirmation?event=${payload.eventSlug}&slot=${payload.slotId}`);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 rounded-lg border border-[var(--border)] bg-white p-5">
      <input type="hidden" {...register("slotId")} />
      {formError ? <p role="alert" className="rounded-md bg-[#fff2f0] p-3 text-sm font-medium text-[var(--maroon-dark)]">{formError}</p> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="First name" error={errors.firstName?.message}><input {...register("firstName")} autoComplete="given-name" className="field" /></Field>
        <Field label="Last name" error={errors.lastName?.message}><input {...register("lastName")} autoComplete="family-name" className="field" /></Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Email" error={errors.email?.message}><input {...register("email")} type="email" autoComplete="email" className="field" /></Field>
        <Field label="Phone" error={errors.phone?.message}><input {...register("phone")} autoComplete="tel" className="field" /></Field>
      </div>
      <Field label="Student/player name (optional)" error={errors.studentName?.message}><input {...register("studentName")} className="field" /></Field>
      <Field label="Notes (optional)" error={errors.notes?.message}><textarea {...register("notes")} rows={4} className="field" /></Field>
      <label className="flex gap-3 text-sm text-[var(--muted)]">
        <input type="checkbox" {...register("consent")} className="mt-1 h-5 w-5 rounded border-[var(--border)]" />
        <span>I understand WHSSignups will use my contact information for this volunteer commitment.</span>
      </label>
      {errors.consent?.message ? <p className="text-sm font-medium text-[var(--maroon-dark)]">{errors.consent.message}</p> : null}
      <button disabled={isSubmitting} className="min-h-12 rounded-md bg-[var(--maroon)] px-5 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">
        {isSubmitting ? "Submitting..." : "Confirm signup"}
      </button>
    </form>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5">
      <span className="font-medium">{label}</span>
      {children}
      {error ? <span className="text-sm font-medium text-[var(--maroon-dark)]">{error}</span> : null}
    </label>
  );
}
