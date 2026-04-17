"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "@/lib/auth-client";

const inputClass =
  "w-full rounded-sm border border-[color:var(--input)] bg-[color:var(--card)] px-3 py-2.5 font-[var(--font-newsreader)] text-[15px] text-foreground placeholder:italic placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-[color:var(--ember)] focus:ring-offset-2 focus:ring-offset-[color:var(--parchment)] disabled:opacity-50";

const labelClass =
  "block font-[var(--font-fraunces)] text-[14px] font-medium text-foreground/85";

export function SignInButton() {
  const { data: session, isPending: sessionPending } = useSession();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);

  if (sessionPending) {
    return (
      <p className="eyebrow text-center text-foreground/55">Loading&hellip;</p>
    );
  }

  if (session) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsPending(true);

    try {
      const result = await signIn.email({
        email,
        password,
        callbackURL: "/dashboard",
      });

      if (result.error) {
        setError(result.error.message || "Failed to sign in");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsPending(false);
    }
  };

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
      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className={labelClass}>
          Password
        </label>
        <input
          id="password"
          type="password"
          placeholder="Your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
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
        {isPending ? "Signing in\u2026" : "Sign in"}
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
      <p className="text-center font-[var(--font-newsreader)] text-[13.5px] text-foreground/60">
        <Link
          href="/forgot-password"
          className="underline-offset-4 hover:text-[color:var(--ember)] hover:underline"
        >
          Forgot your key?
        </Link>
      </p>
    </form>
  );
}
