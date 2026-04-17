import { Suspense } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { auth } from "@/lib/auth";
import { AuthShell } from "../_auth-shell";

export default async function ResetPasswordPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (session) {
    redirect("/dashboard");
  }

  return (
    <AuthShell
      eyebrow="&sect; Threshold &middot; New key"
      titleLead="Set a new"
      titleAccent="key."
      description="Choose a fresh password. Make it memorable — your tales will be waiting on the other side."
    >
      <Suspense
        fallback={
          <p className="eyebrow text-center text-foreground/55">
            Loading&hellip;
          </p>
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </AuthShell>
  );
}
