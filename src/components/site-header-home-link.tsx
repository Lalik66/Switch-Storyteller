import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { SiteHeaderBrand } from "@/components/site-header-brand";

export async function SiteHeaderHomeLink() {
  const t = await getTranslations("Brand");

  return (
    <Link
      href="/"
      className="group flex items-center gap-3.5"
      aria-label={t("ariaHome")}
    >
      <span
        className="relative h-22 w-22 shrink-0 overflow-hidden rounded-full border border-[color:color-mix(in_oklch,var(--ember)_45%,transparent)] bg-[color:var(--card)] shadow-[0_0_18px_-4px_color-mix(in_oklch,var(--ember)_55%,transparent),0_4px_12px_-4px_rgba(0,0,0,0.35)] transition-[transform,box-shadow] duration-300 group-hover:-rotate-6 group-hover:shadow-[0_0_22px_-3px_color-mix(in_oklch,var(--ember)_65%,transparent)]"
        aria-hidden={true}
      >
        <Image
          src="/brand/heros-forge-logo.svg"
          alt=""
          fill
          sizes="96px"
          className="object-cover object-top"
          priority
        />
      </span>
      <SiteHeaderBrand />
    </Link>
  );
}
