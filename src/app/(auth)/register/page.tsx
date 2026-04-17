import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { auth } from "@/lib/auth";
import { AuthShell } from "../_auth-shell";

export default async function RegisterPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (session) {
    redirect("/dashboard");
  }

  return (
    <AuthShell
      eyebrow="&sect; Threshold &middot; Begin"
      titleLead="Begin"
      titleAccent="a tale."
      description="Open a fresh folio. Your first chapter is only a name and a password away."
      footer={
        <>
          Already have a folio?{" "}
          <Link
            href="/login"
            className="text-[color:var(--ember)] underline-offset-4 hover:underline"
          >
            Step back in
          </Link>
        </>
      }
    >
      <SignUpForm />
    </AuthShell>
  );
}
