import { getTranslations } from "next-intl/server";

export async function SiteHeaderBrand() {
  const t = await getTranslations("Brand");

  return (
    <span className="flex flex-col leading-none">
      <span className="eyebrow">{t("eyebrow")}</span>
      <span className="display-lg text-xl text-foreground">
        {t("before")} <em className="italic-wonk">{t("accent")}</em>
      </span>
    </span>
  );
}
