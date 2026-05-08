import { Fraunces, Newsreader, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { LanguageProvider } from "@/components/language-provider";
import { LocalizedSiteFooter } from "@/components/localized-site-footer";
import { SiteHeader } from "@/components/site-header";
import { ServiceWorkerRegister } from "@/components/sw-register";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import type { Metadata, Viewport } from "next";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["SOFT", "WONK", "opsz"],
  display: "swap",
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "The Hero's Forge — Where tales are forged in ink",
    template: "%s · The Hero's Forge",
  },
  description:
    "An illustrated storytelling studio for young authors aged 7–12. Co-write magical adventures with an AI storyteller, earn printed books, and share safe remixes — in a moderated community built for parents' trust.",
  keywords: [
    "kids storytelling",
    "AI stories for children",
    "interactive books",
    "children's reading app",
    "COPPA",
    "writing for kids",
  ],
  authors: [{ name: "The Hero's Forge" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "The Hero's Forge",
    title: "The Hero's Forge — Where tales are forged in ink",
    description:
      "Co-author illustrated adventures with an AI storyteller. Safe, kid-first, parent-trusted.",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Hero's Forge",
    description:
      "Co-author illustrated adventures with an AI storyteller. Safe, kid-first, parent-trusted.",
  },
  robots: { index: true, follow: true },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    title: "Hero's Forge",
    statusBarStyle: "default",
  },
};

// Locks the browser chrome (address bar, status bar) to the brand ember
// when installed as a PWA on Android / Edge. iOS reads this via appleWebApp.
export const viewport: Viewport = {
  themeColor: "#c83e1e",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Resolved server-side from the `heros-forge-ui-lang` cookie (see
  // `src/i18n/request.ts`). Falls back to `en` on first visit; the client
  // LanguageProvider then writes the cookie if it disagrees.
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${fraunces.variable} ${newsreader.variable} ${jetbrains.variable} antialiased grain`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <NextIntlClientProvider locale={locale} messages={messages}>
            <LanguageProvider>
              <div className="relative z-10 flex min-h-screen flex-col">
                <SiteHeader />
                <main id="main-content" className="flex-1">
                  {children}
                </main>
                <LocalizedSiteFooter />
              </div>
              <Toaster richColors position="top-right" />
              <ServiceWorkerRegister />
            </LanguageProvider>
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
