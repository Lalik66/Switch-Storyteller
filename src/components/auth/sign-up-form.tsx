"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signUp } from "@/lib/auth-client";

const inputClass =
  "w-full rounded-sm border border-[color:var(--input)] bg-[color:var(--card)] px-3 py-2.5 font-[var(--font-newsreader)] text-[15px] text-foreground placeholder:italic placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-[color:var(--ember)] focus:ring-offset-2 focus:ring-offset-[color:var(--parchment)] disabled:opacity-50";

const labelClass =
  "block font-[var(--font-fraunces)] text-[14px] font-medium text-foreground/85";

export function SignUpForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setIsPending(true);

    try {
      const result = await signUp.email({
        name,
        email,
        password,
        callbackURL: "/dashboard",
      });

      if (result.error) {
        setError(result.error.message || "Failed to create account");
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
        <label htmlFor="name" className={labelClass}>
          Name
        </label>
        <input
          id="name"
          type="text"
          placeholder={"Your scribe\u2019s name"}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          disabled={isPending}
          className={inputClass}
        />
      </div>
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
          placeholder="Choose a key (8+ characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={isPending}
          className={inputClass}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="confirmPassword" className={labelClass}>
          Confirm password
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
        {isPending ? "Binding your folio\u2026" : "Bind my folio"}
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
