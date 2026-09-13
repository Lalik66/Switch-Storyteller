"use client";

import type { ComponentProps, MouseEvent } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { hashHrefToId, scrollToHashElement } from "@/lib/scroll-to-hash";

type HashScrollLinkProps = Omit<ComponentProps<typeof Link>, "href"> & {
  href: string;
};

/**
 * In-app hash link that scrolls reliably on the home page. Next.js `<Link>`
 * alone often no-ops when the target is already in the DOM (e.g. `#safety`
 * beside the link on desktop).
 */
export function HashScrollLink({
  href,
  onClick,
  scroll = false,
  ...props
}: HashScrollLinkProps) {
  const pathname = usePathname();
  const id = hashHrefToId(href);
  const normalizedHref = href.startsWith("#") ? `/${href}` : href;

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (event.defaultPrevented || !id) return;

    if (pathname === "/") {
      event.preventDefault();
      scrollToHashElement(id);
    }
  };

  return (
    <Link
      href={normalizedHref}
      scroll={scroll}
      onClick={handleClick}
      {...props}
    />
  );
}
