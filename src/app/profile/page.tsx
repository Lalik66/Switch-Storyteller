"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSession } from "@/lib/auth-client";

/* ── tiny inline icon set ─────────────────────────────────────────── */

type IconProps = { className?: string; size?: number };

const stroke = {
  fill: "none" as const,
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const Icons = {
  arrowLeft: ({ className, size = 16 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke} className={className} aria-hidden="true">
      <path d="M19 12H5M11 6l-6 6 6 6" />
    </svg>
  ),
  mail: ({ className, size = 14 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke} className={className} aria-hidden="true">
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 7l10 6 10-6" />
    </svg>
  ),
  calendar: ({ className, size = 14 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke} className={className} aria-hidden="true">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 11h18" />
    </svg>
  ),
  shield: ({ className, size = 14 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke} className={className} aria-hidden="true">
      <path d="M12 3l8 3v6c0 4.5-3.4 8.5-8 9-4.6-.5-8-4.5-8-9V6l8-3z" />
    </svg>
  ),
  lock: ({ className, size = 16 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke} className={className} aria-hidden="true">
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 018 0v4" />
    </svg>
  ),
  phone: ({ className, size = 16 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke} className={className} aria-hidden="true">
      <rect x="7" y="2" width="10" height="20" rx="2" />
      <path d="M11 18h2" />
    </svg>
  ),
  user: ({ className, size = 16 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke} className={className} aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0116 0" />
    </svg>
  ),
};

/* ── small reusable row ───────────────────────────────────────────── */

function InfoRow({
  icon,
  label,
  desc,
  trailing,
}: {
  icon: React.ReactNode;
  label: string;
  desc: string;
  trailing: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border/50 py-4 last:border-b-0">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 text-foreground/55">{icon}</span>
        <div>
          <p className="text-[15px] text-foreground">{label}</p>
          <p className="font-[var(--font-newsreader)] text-[13px] text-foreground/60">
            {desc}
          </p>
        </div>
      </div>
      <div className="shrink-0">{trailing}</div>
    </div>
  );
}

function StatusPill({
  variant = "neutral",
  children,
}: {
  variant?: "ember" | "gold" | "forest" | "neutral";
  children: React.ReactNode;
}) {
  const tone =
    variant === "ember"
      ? "border-[color:var(--ember)]/45 text-[color:var(--ember)] bg-[color:var(--ember)]/8"
      : variant === "gold"
        ? "border-[color:var(--gold)]/50 text-[color:var(--gold)] bg-[color:var(--gold)]/12"
        : variant === "forest"
          ? "border-[color:var(--forest)]/45 text-[color:var(--forest)] bg-[color:var(--forest)]/10"
          : "border-border text-foreground/70 bg-background/60";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.16em] ${tone}`}
    >
      {children}
    </span>
  );
}

/* ── page ─────────────────────────────────────────────────────────── */

export default function ProfilePage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [securityOpen, setSecurityOpen] = useState(false);
  const [emailPrefsOpen, setEmailPrefsOpen] = useState(false);

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/");
    }
  }, [isPending, session, router]);

  if (isPending || !session) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <p className="eyebrow">Loading your folio&hellip;</p>
      </div>
    );
  }

  const user = session.user;
  const createdDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  const handleEditProfileSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    toast.info("Profile updates require backend implementation");
    setEditProfileOpen(false);
  };

  return (
    <section className="container mx-auto max-w-5xl px-6 py-24 md:py-32">
      {/* Back link + section heading */}
      <button
        type="button"
        onClick={() => router.back()}
        className="group inline-flex items-center gap-2 text-foreground/60 transition-colors hover:text-[color:var(--ember)]"
      >
        <Icons.arrowLeft size={14} className="transition-transform group-hover:-translate-x-0.5" />
        <span className="eyebrow !tracking-[0.18em]">Back</span>
      </button>

      <header className="mt-8 mb-12 max-w-2xl">
        <p className="eyebrow">&sect; Your scribe&rsquo;s mark</p>
        <h1 className="display-lg mt-4 text-5xl md:text-6xl">
          Your&nbsp;
          <span className="italic-wonk text-[color:var(--ember)]">folio.</span>
        </h1>
      </header>

      <div className="grid gap-6">
        {/* Overview card */}
        <article className="card-stamp p-8">
          <div className="flex flex-col items-start gap-6 md:flex-row md:items-center">
            <Avatar className="h-20 w-20 border border-border">
              <AvatarImage
                src={user.image || ""}
                alt={user.name || "User"}
                referrerPolicy="no-referrer"
              />
              <AvatarFallback className="font-[var(--font-fraunces)] text-xl italic text-[color:var(--ember)]">
                {(user.name?.[0] || user.email?.[0] || "U").toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <p className="eyebrow">Scribe</p>
              <h2 className="display-lg mt-2 text-3xl leading-none">
                {user.name || "Unnamed traveller"}
              </h2>

              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 font-[var(--font-newsreader)] text-[14px] text-foreground/70">
                <span className="inline-flex items-center gap-2">
                  <Icons.mail className="text-foreground/50" />
                  {user.email}
                </span>
                {user.emailVerified && (
                  <StatusPill variant="forest">
                    <Icons.shield size={10} />
                    Verified
                  </StatusPill>
                )}
                {createdDate && (
                  <span className="inline-flex items-center gap-2 text-foreground/55">
                    <Icons.calendar className="text-foreground/40" />
                    Since {createdDate}
                  </span>
                )}
              </div>
            </div>
          </div>
        </article>

        {/* Account Information */}
        <article className="card-stamp p-8">
          <div className="flex items-baseline justify-between">
            <div>
              <p className="eyebrow">&sect; I &middot; The ledger</p>
              <h2 className="display-lg mt-3 text-3xl">
                Account{" "}
                <span className="italic-wonk text-[color:var(--ember)]">
                  information.
                </span>
              </h2>
            </div>
          </div>

          <div className="rule-ornament my-6">
            <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="4" fill="currentColor" />
            </svg>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <p className="eyebrow mb-2">Full name</p>
              <p className="rounded-sm border border-border/80 bg-background/40 px-4 py-3 font-[var(--font-newsreader)] text-[15px]">
                {user.name || "Not provided"}
              </p>
            </div>
            <div>
              <p className="eyebrow mb-2">Email address</p>
              <div className="flex items-center justify-between gap-3 rounded-sm border border-border/80 bg-background/40 px-4 py-3 font-[var(--font-newsreader)] text-[15px]">
                <span className="truncate">{user.email}</span>
                {user.emailVerified && (
                  <StatusPill variant="forest">Verified</StatusPill>
                )}
              </div>
            </div>
          </div>

          <div className="mt-8">
            <p className="eyebrow mb-4">Standing</p>
            <InfoRow
              icon={<Icons.shield size={18} />}
              label="Email verification"
              desc="Status of your email verification"
              trailing={
                user.emailVerified ? (
                  <StatusPill variant="forest">Verified</StatusPill>
                ) : (
                  <StatusPill>Unverified</StatusPill>
                )
              }
            />
            <InfoRow
              icon={<Icons.user size={18} />}
              label="Account type"
              desc="Your access level at the Forge"
              trailing={<StatusPill variant="gold">Apprentice</StatusPill>}
            />
          </div>
        </article>

        {/* Recent activity */}
        <article className="card-stamp p-8">
          <p className="eyebrow">&sect; II &middot; Recent hours</p>
          <h2 className="display-lg mt-3 text-3xl">
            Quiet{" "}
            <span className="italic-wonk text-[color:var(--ember)]">
              hours.
            </span>
          </h2>
          <p className="mt-2 font-[var(--font-newsreader)] text-[14.5px] text-foreground/65">
            A quiet record of your sessions.
          </p>

          <div className="rule-ornament my-6">
            <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="4" fill="currentColor" />
            </svg>
          </div>

          <InfoRow
            icon={
              <span className="relative flex h-2 w-2 items-center justify-center">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[color:var(--forest)]/60 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[color:var(--forest)]" />
              </span>
            }
            label="Current session"
            desc="Active right now"
            trailing={<StatusPill variant="forest">Active</StatusPill>}
          />
        </article>

        {/* Quick actions */}
        <article className="card-stamp p-8">
          <p className="eyebrow">&sect; III &middot; Quick actions</p>
          <h2 className="display-lg mt-3 text-3xl">
            Manage your{" "}
            <span className="italic-wonk text-[color:var(--ember)]">
              folio.
            </span>
          </h2>

          <div className="rule-ornament my-6">
            <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="4" fill="currentColor" />
            </svg>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {[
              {
                icon: <Icons.user size={18} />,
                title: "Edit profile",
                desc: "Update your information",
                onClick: () => setEditProfileOpen(true),
              },
              {
                icon: <Icons.shield size={18} />,
                title: "Security",
                desc: "Authentication options",
                onClick: () => setSecurityOpen(true),
              },
              {
                icon: <Icons.mail size={18} />,
                title: "Email preferences",
                desc: "Configure notifications",
                onClick: () => setEmailPrefsOpen(true),
              },
            ].map((action) => (
              <button
                key={action.title}
                type="button"
                onClick={action.onClick}
                className="group flex items-start gap-3 rounded-sm border border-border/80 bg-background/60 p-4 text-left transition-all hover:-translate-y-[1px] hover:border-[color:var(--ember)] hover:bg-[color:var(--gold)]/15"
              >
                <span className="mt-0.5 text-foreground/55 transition-colors group-hover:text-[color:var(--ember)]">
                  {action.icon}
                </span>
                <span className="flex-1">
                  <span className="block text-[15px] text-foreground">
                    {action.title}
                  </span>
                  <span className="mt-0.5 block font-[var(--font-newsreader)] text-[13px] text-foreground/60">
                    {action.desc}
                  </span>
                </span>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="mt-1 text-foreground/30 transition-all group-hover:translate-x-1 group-hover:text-[color:var(--ember)]"
                  aria-hidden="true"
                >
                  <path
                    d="M5 12h14M13 6l6 6-6 6"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            ))}
          </div>
        </article>
      </div>

      {/* ── Dialogs ─────────────────────────────────────────────── */}

      <Dialog open={editProfileOpen} onOpenChange={setEditProfileOpen}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <p className="eyebrow">&sect; Edit</p>
            <DialogTitle className="display-lg text-3xl">
              Edit your{" "}
              <span className="italic-wonk text-[color:var(--ember)]">
                folio.
              </span>
            </DialogTitle>
            <DialogDescription className="font-[var(--font-newsreader)] text-[14.5px]">
              Update your information. Changes save to your account.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditProfileSubmit} className="space-y-5 pt-2">
            <div className="space-y-2">
              <Label htmlFor="name" className="eyebrow">
                Full name
              </Label>
              <Input
                id="name"
                defaultValue={user.name || ""}
                placeholder="Enter your name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="eyebrow">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                defaultValue={user.email || ""}
                disabled
                className="bg-[color:var(--gold)]/10"
              />
              <p className="font-[var(--font-newsreader)] text-[12px] text-foreground/55">
                Email cannot be changed for OAuth accounts.
              </p>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditProfileOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Save changes</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={securityOpen} onOpenChange={setSecurityOpen}>
        <DialogContent className="sm:max-w-[540px]">
          <DialogHeader>
            <p className="eyebrow">&sect; Security</p>
            <DialogTitle className="display-lg text-3xl">
              Under{" "}
              <span className="italic-wonk text-[color:var(--ember)]">
                lock &amp; key.
              </span>
            </DialogTitle>
            <DialogDescription className="font-[var(--font-newsreader)] text-[14.5px]">
              Authentication and account protection.
            </DialogDescription>
          </DialogHeader>
          <div className="pt-2">
            <InfoRow
              icon={<Icons.lock size={18} />}
              label="Password"
              desc={
                user.email?.includes("@gmail")
                  ? "Managed by Google"
                  : "Set a password for your account"
              }
              trailing={
                <StatusPill>
                  {user.email?.includes("@gmail") ? "OAuth" : "Not set"}
                </StatusPill>
              }
            />
            <InfoRow
              icon={<Icons.phone size={18} />}
              label="Two-factor authentication"
              desc="An extra layer of protection"
              trailing={
                <Button variant="outline" size="sm" disabled>
                  Coming soon
                </Button>
              }
            />
            <InfoRow
              icon={<Icons.shield size={18} />}
              label="Active sessions"
              desc="Devices currently signed in"
              trailing={<StatusPill variant="forest">1 active</StatusPill>}
            />
          </div>
          <div className="flex justify-end pt-4">
            <Button variant="outline" onClick={() => setSecurityOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={emailPrefsOpen} onOpenChange={setEmailPrefsOpen}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <p className="eyebrow">&sect; Correspondence</p>
            <DialogTitle className="display-lg text-3xl">
              Letters from the{" "}
              <span className="italic-wonk text-[color:var(--ember)]">
                Forge.
              </span>
            </DialogTitle>
            <DialogDescription className="font-[var(--font-newsreader)] text-[14.5px]">
              Configure which envelopes reach your inbox.
            </DialogDescription>
          </DialogHeader>
          <div className="pt-2">
            <InfoRow
              icon={<Icons.mail size={18} />}
              label="Marketing emails"
              desc="Product news and announcements"
              trailing={<StatusPill variant="gold">Coming soon</StatusPill>}
            />
            <InfoRow
              icon={<Icons.shield size={18} />}
              label="Security alerts"
              desc="Important account notifications"
              trailing={<StatusPill variant="ember">Always on</StatusPill>}
            />
          </div>
          <div className="flex justify-end pt-4">
            <Button variant="outline" onClick={() => setEmailPrefsOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
