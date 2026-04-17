"use client";

import { useState } from "react";
import Link from "next/link";
import { requestPasswordReset } from "@/lib/auth-client";

const inputClass =
  "w-full rounded-sm border border-[color:var(--input)] bg-[color:var(--card)] px-3 py-2.5 font-[var(--font-newsreader)] text-[15px] text-foreground placeholder:italic placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-[color:var(--ember)] focus:ring-offset-2 focus:ring-offset-[color:var(--parchment)] disabled:opacity-50";

const labelClass =
  "block font-[var(--font-fraunces)] text-[14px] font-medium text-foreground/85";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsPending(true);

    try {
      const result = await requestPasswordReset({
        email,
        redirectTo: "/reset-password",
      });

      if (result.error) {
        setError(result.error.message || "Failed to send reset email");
      } else {
        setSuccess(true);
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsPending(false);
    }
  };

  if (success) {
    return (
      <div className="flex w-full flex-col gap-5 text-center">
        <div className="rule-ornament">
          <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M12 2l2 7 7 2-7 2-2 7-2-7-7-2 7-2z"
              fill="currentColor"
            />
          </svg>
        </div>
        <p className="font-[var(--font-newsreader)] text-[15px] leading-relaxed text-foreground/75">
          If a folio exists under that email, a note with a fresh key has been
          sent. Check your terminal for the reset URL.
        </p>
        <Link
          href="/login"
          className="btn-ghost-ink w-full justify-center text-center"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className={labelClass}>
          Email
        </label>
        <input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isPending}
          className={inputClass}
        />
      </div>
      {error && (
        <p
          role="alert"
          className="font-[var(--font-newsreader)] text-[13.5px] italic text-[color:var(--destructive)]"
        >
          {error}
        </p>
      )}
      <button
        type="submit"
        className="btn-ember w-full justify-center disabled:opacity-60"
        disabled={isPending}
      >
        {isPending ? "Sending\u2026" : "Send reset link"}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path
            d="M5 12h14M13 6l6 6-6 6"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </form>
  );
}
