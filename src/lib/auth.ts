import { render } from "@react-email/components";
import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { Resend } from "resend";
import { ResetPasswordEmail } from "@/emails/reset-password";
import { VerifyEmail } from "@/emails/verify-email";
import { db } from "./db"
import { getServerEnv } from "./env";

// Same sending identity family as the parent digest cron
// (src/app/api/cron/parent-digest/route.ts). The Resend-verified sending
// domain is mail.herosforge.app (subdomain), NOT the bare apex — senders
// on @herosforge.app are rejected with a 403.
const AUTH_EMAIL_FROM = "The Hero's Forge <auth@mail.herosforge.app>";

/**
 * Deliver a transactional auth email via Resend. When RESEND_API_KEY is
 * not configured (local dev), fall back to printing the link to the
 * terminal so signup / reset flows stay fully testable without an
 * email provider.
 */
async function sendAuthEmail(opts: {
  to: string;
  subject: string;
  html: string;
  devLabel: string;
  url: string;
}) {
  const { RESEND_API_KEY } = getServerEnv();

  if (!RESEND_API_KEY) {
    // eslint-disable-next-line no-console
    console.log(
      `\n${"=".repeat(60)}\n${opts.devLabel} (RESEND_API_KEY not set — link below)\nUser: ${opts.to}\nURL: ${opts.url}\n${"=".repeat(60)}\n`,
    );
    return;
  }

  const resend = new Resend(RESEND_API_KEY);
  await resend.emails.send({
    from: AUTH_EMAIL_FROM,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
  });
}

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      await sendAuthEmail({
        to: user.email,
        subject: "Reset your Hero's Forge password",
        html: await render(
          ResetPasswordEmail({
            userName: user.name?.trim().split(" ")[0] || "there",
            resetUrl: url,
          }),
        ),
        devLabel: "PASSWORD RESET REQUEST",
        url,
      });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendAuthEmail({
        to: user.email,
        subject: "Verify your Hero's Forge email",
        html: await render(
          VerifyEmail({
            userName: user.name?.trim().split(" ")[0] || "there",
            verifyUrl: url,
          }),
        ),
        devLabel: "EMAIL VERIFICATION",
        url,
      });
    },
  },
})
