import type { Metadata } from 'next';
import { HeroSection } from '@/components/our-work/HeroSection';
import { FeaturedVideoSection } from '@/components/our-work/FeaturedVideoSection';
import { ContentBanner } from '@/components/our-work/ContentBanner';
import { VideoGrid } from '@/components/our-work/VideoGrid';
import { LogoSection } from '@/components/our-work/LogoSection';
import { CTASection } from '@/components/home/CTASection';
import Image from 'next/image';
import FishChaseHero from '@/components/FishChaseHero';

export const metadata: Metadata = {
  title: 'Our Work',
  description: 'View our portfolio of professional video production projects for the fishing industry.',
  alternates: {
    canonical: 'https://bassclown.com/our-work',
  },
};

export default function OurWork() {
  return (
    <main className="flex flex-col min-h-screen pb-0 bg-black">
      {/* Hero Section with "CATCH OF THE DAY" */}
      <FishChaseHero title="CATCH OF THE DAY!" description=" Here are just a few of our COMMERCIALS and REELS we are proud to show." />
      <HeroSection />
      {/* 
      <div className="md:py-16">

          <Image src="/images/assets/video-reel-1.svg" alt="Video Reel" width={1000} height={1000} className="w-full h-full object-cover" />
      </div>
      Featured Video Section 
      <FeaturedVideoSection />
      */}
      {/* Red Banner */}

          <ContentBanner BannerText="VIEW MORE OF OUR CONTENT BELOW" />

      
      {/* Video Grid */}
      <VideoGrid />
      
      {/* Logo Section */}
      <LogoSection />
      
      {/* CTA Section */}
      <CTASection />
    </main>
  );
}
