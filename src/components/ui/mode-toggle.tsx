"use client";

import { useTheme } from "next-themes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function SunIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="absolute scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0"
      aria-hidden="true"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

export function ModeToggle() {
  const { setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Toggle lantern"
          className="relative grid h-9 w-9 place-items-center rounded-full border border-[color:var(--border)] bg-transparent text-foreground/75 transition-all hover:-translate-y-[1px] hover:border-[color:var(--ember)] hover:text-[color:var(--ember)]"
        >
          <SunIcon />
          <MoonIcon />
          <span className="sr-only">Toggle lantern</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="border-[color:var(--border)] bg-[color:var(--card)]"
      >
        <DropdownMenuItem
          onClick={() => setTheme("light")}
          className="font-[var(--font-fraunces)] text-[14px] focus:bg-[color:var(--gold)]/20 focus:text-[color:var(--ember)]"
        >
          Parchment
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("dark")}
          className="font-[var(--font-fraunces)] text-[14px] focus:bg-[color:var(--gold)]/20 focus:text-[color:var(--ember)]"
        >
          Lantern-lit
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("system")}
          className="font-[var(--font-fraunces)] text-[14px] focus:bg-[color:var(--gold)]/20 focus:text-[color:var(--ember)]"
        >
          Follow the sky
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
