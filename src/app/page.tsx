import {
  HeroConstellation,
  HeroInkSwirl,
} from "@/components/marketing/hero-decorations";
import { HomeHeroLead } from "@/components/marketing/home-hero-lead";
import { LandingBelowFold } from "@/components/marketing/landing-below-fold";
import { ManuscriptCardDemo } from "@/components/marketing/manuscript-card-demo";

export default function Home() {
  return (
    <>
      <Hero />
      <LandingBelowFold />
    </>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden pb-24 pt-16 md:pt-24">
      <HeroConstellation className="absolute left-[6%] top-[12%] hidden md:block" />
      <HeroConstellation
        className="absolute right-[8%] top-[22%] hidden md:block"
        variant="b"
      />
      <HeroInkSwirl />

      <div className="container relative mx-auto grid grid-cols-1 gap-12 px-6 lg:grid-cols-12 lg:gap-8">
        <HomeHeroLead />

        <div
          className="relative lg:col-span-5 rise"
          style={{ animationDelay: "300ms" }}
        >
          <ManuscriptCardDemo />
        </div>
      </div>
    </section>
  );
}
