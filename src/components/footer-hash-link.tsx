"use client";

import Link from "next/link";
import { HashScrollLink } from "@/components/hash-scroll-link";

export function FooterHashLink({
  href,
  className,
  children,
}: {
  href: string;
  className: string;
  children: React.ReactNode;
}) {
  if (href.includes("#")) {
    return (
      <HashScrollLink href={href} className={className}>
        {children}
      </HashScrollLink>
    );
  }

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}
