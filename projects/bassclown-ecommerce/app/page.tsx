import { Hero } from "@/components/home/Hero";
import { MediaCompanySection } from "@/components/home/MediaCompanySection";
import { FishStoriesSection } from "@/components/home/FishStoriesSection";
import { ServicesSection } from "@/components/home/ServicesSection";
import { PartnersSection } from "@/components/home/PartnersSection";
import { CTASection } from "@/components/home/CTASection";
import VideoReelBottomHalfIcon from "@/components/videoReelBottom";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col relative">
     
      <Hero />
      <div className="flex flex-col gap-2 md:gap-4 relative">
        <VideoReelBottomHalfIcon className="absolute bottom-0 left-0 w-full h-fit scale-75 md:scale-100" color="white" />
      </div>
      <MediaCompanySection />
      <FishStoriesSection />
      <ServicesSection />
      <PartnersSection />
      <CTASection />
    </main>
  );
}
