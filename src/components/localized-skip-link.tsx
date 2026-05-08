import { getTranslations } from "next-intl/server";

/**
 * Skip-to-content link rendered server-side from the cookie-resolved locale.
 * No client JS required — the label is a single static string.
 */
export async function LocalizedSkipLink() {
  const t = await getTranslations("Common");

  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:border focus:bg-background focus:px-4 focus:py-2 focus:text-foreground"
    >
      {t("skipToContent")}
    </a>
  );
}
