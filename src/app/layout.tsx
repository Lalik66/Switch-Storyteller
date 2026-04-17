import { Fraunces, Newsreader, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/components/language-provider";
import { LocalizedSiteFooter } from "@/components/localized-site-footer";
import { SiteHeader } from "@/components/site-header";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import type { Metadata } from "next";

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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${fraunces.variable} ${newsreader.variable} ${jetbrains.variable} antialiased grain`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <LanguageProvider>
            <div className="relative z-10 flex min-h-screen flex-col">
              <SiteHeader />
              <main id="main-content" className="flex-1">
                {children}
              </main>
              <LocalizedSiteFooter />
            </div>
            <Toaster richColors position="top-right" />
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
