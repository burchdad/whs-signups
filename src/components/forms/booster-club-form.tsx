"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Script from "next/script";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { boosterClubSignupSchema, type BoosterClubSignupInput } from "@/lib/validation";

declare global {
  interface Window {
    onBoosterTurnstileSuccess?: (token: string) => void;
  }
}

export function BoosterClubForm({ turnstileSiteKey }: { turnstileSiteKey?: string }) {
  const [formError, setFormError] = useState<string | null>(null);
  const [complete, setComplete] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<BoosterClubSignupInput>({
    resolver: zodResolver(boosterClubSignupSchema),
    defaultValues: {
      gearPreference: "shirt",
      openToVolunteering: "yes",
      interestedInSponsoring: "no",
      consent: undefined,
    },
  });

  async function onSubmit(values: BoosterClubSignupInput) {
    setFormError(null);
    setComplete(false);
    const response = await fetch("/api/booster-club", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const payload = await response.json();
    if (!response.ok) {
      setFormError(payload.message ?? "We could not complete the Booster Club signup.");
      return;
    }
    reset({
      gearPreference: "shirt",
      openToVolunteering: "yes",
      interestedInSponsoring: "no",
      consent: undefined,
    });
    setComplete(true);
  }

  useEffect(() => {
    window.onBoosterTurnstileSuccess = (token: string) => setValue("turnstileToken", token);
    return () => {
      delete window.onBoosterTurnstileSuccess;
    };
  }, [setValue]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 rounded-sm border border-[var(--border)] bg-white p-5 shadow-sm">
      <input type="hidden" {...register("turnstileToken")} />
      {turnstileSiteKey ? <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer /> : null}
      {complete ? <p role="status" className="rounded-sm bg-[#f1fbf3] p-3 text-sm font-black text-[#225c2d]">You are on the Booster Club list. Thank you for supporting the Wildcats.</p> : null}
      {formError ? <p role="alert" className="rounded-sm bg-[#fff2f0] p-3 text-sm font-medium text-[var(--maroon-dark)]">{formError}</p> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="First name" error={errors.firstName?.message}><input {...register("firstName")} autoComplete="given-name" className="field" /></Field>
        <Field label="Last name" error={errors.lastName?.message}><input {...register("lastName")} autoComplete="family-name" className="field" /></Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Email" error={errors.email?.message}><input {...register("email")} type="email" autoComplete="email" className="field" /></Field>
        <Field label="Phone" error={errors.phone?.message}><input {...register("phone")} autoComplete="tel" className="field" /></Field>
      </div>
      <Field label="Booster item" error={errors.gearPreference?.message}>
        <select {...register("gearPreference")} className="field font-semibold">
          <option value="shirt">Shirt</option>
          <option value="hat">Hat</option>
        </select>
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Open to volunteering?" error={errors.openToVolunteering?.message}>
          <select {...register("openToVolunteering")} className="field font-semibold">
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </Field>
        <Field label="Interested in sponsoring?" error={errors.interestedInSponsoring?.message}>
          <select {...register("interestedInSponsoring")} className="field font-semibold">
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </select>
        </Field>
      </div>
      <label className="flex gap-3 text-sm text-[var(--muted)]">
        <input type="checkbox" {...register("consent")} className="mt-1 h-5 w-5 rounded border-[var(--border)]" />
        <span>I understand WHSSignups will use my contact information for Booster Club follow-up.</span>
      </label>
      {errors.consent?.message ? <p className="text-sm font-medium text-[var(--maroon-dark)]">{errors.consent.message}</p> : null}
      {turnstileSiteKey ? <div className="cf-turnstile" data-sitekey={turnstileSiteKey} data-callback="onBoosterTurnstileSuccess" /> : null}
      <button disabled={isSubmitting} className="min-h-12 rounded-sm bg-[var(--maroon)] px-5 font-black uppercase tracking-wide text-white disabled:cursor-not-allowed disabled:opacity-60">
        {isSubmitting ? "Submitting..." : "Join Booster Club"}
      </button>
    </form>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5">
      <span className="font-black uppercase tracking-wide text-[var(--ink)]">{label}</span>
      {children}
      {error ? <span className="text-sm font-medium text-[var(--maroon-dark)]">{error}</span> : null}
    </label>
  );
}
