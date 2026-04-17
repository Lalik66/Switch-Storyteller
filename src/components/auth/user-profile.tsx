"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut, useSession } from "@/lib/auth-client";

const stroke = {
  fill: "none" as const,
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function UserIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      aria-hidden="true"
      {...stroke}
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function DoorIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      aria-hidden="true"
      {...stroke}
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  );
}

export function UserProfile() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  if (isPending) {
    return (
      <span className="eyebrow text-foreground/55">Loading&hellip;</span>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center gap-4">
        <Link
          href="/login"
          className="eyebrow text-foreground/65 transition-colors hover:text-[color:var(--ember)]"
        >
          Sign in
        </Link>
        <Link
          href="/register"
          className="group inline-flex items-center gap-1.5 rounded-full border border-[color:var(--ember)]/70 px-3.5 py-1.5 font-[var(--font-fraunces)] text-[13px] text-[color:var(--ember)] transition-all hover:-translate-y-[1px] hover:bg-[color:var(--ember)] hover:text-[color:var(--primary-foreground)]"
        >
          Begin a tale
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            className="transition-transform group-hover:translate-x-0.5"
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
        </Link>
      </div>
    );
  }

  const handleSignOut = async () => {
    await signOut();
    router.replace("/");
    router.refresh();
  };

  const initial = (
    session.user?.name?.[0] ??
    session.user?.email?.[0] ??
    "U"
  ).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Open scribe menu"
          className="group relative rounded-full ring-1 ring-[color:var(--ember)]/40 ring-offset-2 ring-offset-[color:var(--parchment)] transition-all hover:ring-[color:var(--ember)]"
        >
          <Avatar className="size-8">
            <AvatarImage
              src={session.user?.image || ""}
              alt={session.user?.name || "User"}
              referrerPolicy="no-referrer"
            />
            <AvatarFallback className="bg-[color:var(--gold)]/30 font-[var(--font-fraunces)] text-[15px] italic text-[color:var(--ember)]">
              {initial}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-60 border-[color:var(--border)] bg-[color:var(--card)]"
      >
        <DropdownMenuLabel className="font-normal">
          <p className="eyebrow text-foreground/55">&sect; The scribe</p>
          <p className="mt-2 font-[var(--font-fraunces)] text-[15px] leading-tight text-foreground">
            {session.user?.name}
          </p>
          <p className="mt-0.5 truncate font-[var(--font-newsreader)] text-[12.5px] text-foreground/60">
            {session.user?.email}
          </p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          asChild
          className="font-[var(--font-fraunces)] text-[14px] focus:bg-[color:var(--gold)]/20 focus:text-[color:var(--ember)]"
        >
          <Link href="/profile" className="flex items-center gap-2.5">
            <UserIcon />
            Your folio
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          asChild
          className="font-[var(--font-fraunces)] text-[14px] focus:bg-[color:var(--gold)]/20 focus:text-[color:var(--ember)]"
        >
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              aria-hidden="true"
              {...stroke}
            >
              <path d="M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z" />
            </svg>
            The workshop
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleSignOut}
          className="font-[var(--font-fraunces)] text-[14px] text-foreground/75 focus:bg-[color:var(--ember)]/10 focus:text-[color:var(--ember)]"
        >
          <DoorIcon />
          Close the door
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
