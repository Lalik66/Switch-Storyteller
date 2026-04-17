import { UserProfile } from "@/components/auth/user-profile";
import { LanguageSwitcher } from "@/components/language-switcher";
import { LocalizedSkipLink } from "@/components/localized-skip-link";
import { MainNavLinks } from "@/components/main-nav-links";
import { SiteHeaderHomeLink } from "@/components/site-header-home-link";
import { ModeToggle } from "./ui/mode-toggle";

export function SiteHeader() {
  return (
    <>
      <LocalizedSkipLink />
      <header
        className="relative border-b border-border/60 backdrop-blur-[2px]"
        role="banner"
      >
        <nav
          className="container mx-auto flex items-center justify-between px-6 py-5"
          aria-label="Main navigation"
        >
          <SiteHeaderHomeLink />

          <MainNavLinks />

          <div
            className="flex items-center gap-3"
            role="group"
            aria-label="User actions"
          >
            <LanguageSwitcher />
            <ModeToggle />
            <UserProfile />
          </div>
        </nav>
      </header>
    </>
  );
}
