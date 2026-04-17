import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { auth } from "@/lib/auth";
import { AuthShell } from "../_auth-shell";

export default async function ForgotPasswordPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (session) {
    redirect("/dashboard");
  }

  return (
    <AuthShell
      eyebrow="&sect; Threshold &middot; Lost key"
      titleLead="A forgotten"
      titleAccent="key."
      description="Share the email on your folio and we&rsquo;ll send a quiet note with a fresh way in."
      footer={
        <>
          Remembered it?{" "}
          <Link
            href="/login"
            className="text-[color:var(--ember)] underline-offset-4 hover:underline"
          >
            Back to sign in
          </Link>
        </>
      }
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
