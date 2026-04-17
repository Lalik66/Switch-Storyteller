"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { resetPassword } from "@/lib/auth-client";

const inputClass =
  "w-full rounded-sm border border-[color:var(--input)] bg-[color:var(--card)] px-3 py-2.5 font-[var(--font-newsreader)] text-[15px] text-foreground placeholder:italic placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-[color:var(--ember)] focus:ring-offset-2 focus:ring-offset-[color:var(--parchment)] disabled:opacity-50";

const labelClass =
  "block font-[var(--font-fraunces)] text-[14px] font-medium text-foreground/85";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const error = searchParams.get("error");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [isPending, setIsPending] = useState(false);

  if (error === "invalid_token" || !token) {
    return (
      <div className="flex w-full flex-col gap-5 text-center">
        <p className="font-[var(--font-newsreader)] text-[15px] leading-relaxed italic text-[color:var(--destructive)]">
          {error === "invalid_token"
            ? "This reset link is invalid or has expired."
            : "No reset token was provided."}
        </p>
        <Link
          href="/forgot-password"
          className="btn-ghost-ink w-full justify-center text-center"
        >
          Request a new link
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (password !== confirmPassword) {
      setFormError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setFormError("Password must be at least 8 characters");
      return;
    }

    setIsPending(true);

    try {
      const result = await resetPassword({
        newPassword: password,
        token,
      });

      if (result.error) {
        setFormError(result.error.message || "Failed to reset password");
      } else {
        router.push("/login?reset=success");
      }
    } catch {
      setFormError("An unexpected error occurred");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className={labelClass}>
          New password
        </label>
        <input
          id="password"
          type="password"
          placeholder="Choose a new key (8+ characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={isPending}
          className={inputClass}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="confirmPassword" className={labelClass}>
          Confirm new password
        </label>
        <input
          id="confirmPassword"
          type="password"
          placeholder="Again, to be sure"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          disabled={isPending}
          className={inputClass}
        />
      </div>
      {formError && (
        <p
          role="alert"
          className="font-[var(--font-newsreader)] text-[13.5px] italic text-[color:var(--destructive)]"
        >
          {formError}
        </p>
      )}
      <button
        type="submit"
        className="btn-ember w-full justify-center disabled:opacity-60"
        disabled={isPending}
      >
        {isPending ? "Resetting\u2026" : "Set new key"}
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
