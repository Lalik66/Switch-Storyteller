import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SignInButton } from "@/components/auth/sign-in-button";
import { auth } from "@/lib/auth";
import { AuthShell } from "../_auth-shell";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reset?: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (session) {
    redirect("/dashboard");
  }

  const { reset } = await searchParams;

  return (
    <AuthShell
      eyebrow="&sect; Threshold &middot; Sign in"
      titleLead="Welcome"
      titleAccent="back."
      description="Step back through the door. Your tales are waiting exactly where you left them."
      footer={
        <>
          New to the Forge?{" "}
          <Link
            href="/register"
            className="text-[color:var(--ember)] underline-offset-4 hover:underline"
          >
            Begin a tale
          </Link>
        </>
      }
    >
      {reset === "success" && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-sm border border-[color:var(--forest)]/40 bg-[color:var(--forest)]/10 px-3 py-2.5 font-[var(--font-newsreader)] text-[13.5px] leading-relaxed text-[color:var(--forest)]"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mt-0.5 shrink-0"
            aria-hidden="true"
          >
            <path d="M20 6L9 17l-5-5" />
          </svg>
          <span>
            Password reset successfully. Please sign in with your new password.
          </span>
        </div>
      )}
      <SignInButton />
    </AuthShell>
  );
}
