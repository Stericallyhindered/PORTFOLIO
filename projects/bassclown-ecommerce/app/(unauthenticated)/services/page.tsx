import type { Metadata } from 'next';
import Image from 'next/image';
import { SERVICE_BLOCKS } from "@/lib/constants";
import { ServiceBlockCard } from "@/components/ServiceBlockCard";
import { Footer } from "@/components/Footer";
import { CTASection } from '@/components/home/CTASection';
import FishChaseHero from '@/components/FishChaseHero';

export const metadata: Metadata = {
  title: 'Our Services',
  description: 'Professional video production services for the fishing industry including brand development, product launches, reviews, and promotional content.',
  alternates: {
    canonical: 'https://bassclown.com/services',
  },
};

export default function Services() {
  return (
    <main className="flex flex-col min-h-screen bg-white">
      {/* Hero Section */}
      <FishChaseHero title="OUR SERVICES!" description="We Have Many Skillsets, Find out more about which service is right for you and your company!" />

      {/* Services Blocks */}
      <section className="bg-[#323132] py-16 relative">
        {/* Subtle Background Pattern */}
        <div 
          className="absolute inset-0 opacity-5 pointer-events-none" 
          style={{ 
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)', 
            backgroundSize: '30px 30px' 
          }}
        ></div>

        <div className="px-4 relative z-10">
          {/* Services List */}
          <div className="space-y-6 md:space-y-24 flex flex-col items-center justify-center">
            {SERVICE_BLOCKS.map((service, index) => (
              <div key={index}>
                <div className="container mx-auto px-4">
                  <ServiceBlockCard 
                    title={service.title}
                    description={service.description}
                    bannerColor={service.bannerColor}
                    polaroidImage={service.polaroidImage}
                    polaroidVideo={service.polaroidVideo}
                    polaroidCaption={service.polaroidCaption}
                    icon={service.icon}
                    index={index}
                    expandedDescription={service.expandedDescription}
                    />
                  </div>
                <div className="w-screen h-6 my-6 md:my-12 opacity-80 relative">
                    <div className="absolute bottom-20 left-0 w-full z-10">
                      <Image src="/images/assets/video-reel-1.svg" 
                        alt="Film Reel" 
                        width={2560}
                        height={44}
                        className="object-cover saturate-150 brightness-50" />
                    </div>
                    <div className={`absolute top-20 w-full z-0 pl-10 ${index % 2 === 0 ? "flex justify-start" : "flex translate-x-[90%] scale-y-[-1] "}`}>
                      <Image src="/images/assets/bubbles.svg" 
                          alt="Bubbles" 
                          width={400}
                          height={400}
                          className="object-cover saturate-50 brightness-200 hue-rotate-90 opacity-50" 
                          />
                    </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <div className="w-full flex flex-col justify-center items-center h-96 relative bg-[#323132] z-10">
        <Image src="/images/assets/bubbles.svg" 
            alt="Bubbles" 
            width={250}
            height={250}
            className="object-cover saturate-50 brightness-150 hue-rotate-90 absolute bottom-50 scale-x-[-1] left-10" 
            />
        
        <Image src="/images/assets/bass-clown-red-cream.png" 
            alt="Bubbles" 
            width={250}
            height={250}
            className="object-cover  " 
            />
        
        <div className="w-screen h-6 my-12 ">
                    <div className="absolute -bottom-10 w-full z-10">
                      <Image src="/images/assets/video-reel-1.svg" 
                        alt="Film Reel" 
                        width={2560}
                        height={44}
                        className="object-cover saturate-150 brightness-50" />
                    </div>
                </div>
      </div>
      <CTASection />

    </main>
  );
}
