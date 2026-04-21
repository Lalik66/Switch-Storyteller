import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Hero's Forge",
    short_name: "Hero's Forge",
    description:
      "Personalised bedtime stories for curious children — crafted one hero at a time.",
    start_url: "/",
    display: "standalone",
    background_color: "#faf7f2",
    theme_color: "#c83e1e",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
