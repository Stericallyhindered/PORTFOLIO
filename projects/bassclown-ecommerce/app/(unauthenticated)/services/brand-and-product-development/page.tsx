import type { Metadata } from 'next';
import Image from "next/image";
import { Lightbulb, Rocket, BarChart3, RefreshCw, Layers, Zap } from "lucide-react";
import Link from "next/link";
import { CTASection } from '@/components/home/CTASection'; // Added
import FishChaseHero from '@/components/FishChaseHero';

export const metadata: Metadata = {
  title: 'Brand & Product Development',
  description: 'Strategic video content to support your fishing brand and product launches. Professional production services to establish and strengthen your brand identity.',
  alternates: {
    canonical: 'https://bassclown.com/services/brand-and-product-development',
  },
};

const services = [
  {
    icon: Lightbulb,
    title: "Brand Strategy Development",
    description: "Comprehensive brand positioning and messaging strategy tailored for the fishing industry."
  },
  {
    icon: Layers,
    title: "Brand Identity Videos",
    description: "Compelling video content that clearly communicates your brand's values and personality."
  },
  {
    icon: Rocket,
    title: "Product Launch Campaigns",
    description: "Strategic video campaigns designed to create maximum impact for your new products."
  },
  {
    icon: RefreshCw,
    title: "Brand Evolution",
    description: "Video content that helps transition your brand to new markets or repositioning."
  },
  {
    icon: Zap,
    title: "Product Story Development",
    description: "Narrative-driven content that connects customers emotionally to your products."
  },
  {
    icon: BarChart3,
    title: "Performance Analysis",
    description: "Data-driven assessment of your content's impact and recommendations for optimization."
  },
];

const caseStudies = [
  {
    title: "RiverRod Reels",
    description: "Complete brand identity and product launch campaign resulting in 45% sales increase",
    image: "/images/assets/bass-clown-co-fish-chase.png" // Placeholder
  },
  {
    title: "LakeMaster Lures",
    description: "Brand refresh videos and product storytelling resulting in 30% engagement boost",
    image: "/images/assets/bass-taking-picture.svg" // Placeholder
  }
];

export default function BrandAndProductDevelopment() {
  return (
    <main className="flex flex-col min-h-screen bg-[#1A1A1A] text-cream"> {/* Main theme */}

      {/* Hero Section */}
      <FishChaseHero title="BRAND & PRODUCT DEVELOPMENT!" description="Strategic Brand Growth & Product Launches" />

      
      {/* Main Content Section */}
      <section className="container mx-auto px-4 py-12 md:py-16">
        {/* Hero Image Section (Sub-Hero) */}
        <div className="relative w-full h-[450px] mb-16 md:mb-24 rounded-lg overflow-hidden shadow-xl">
          <Image
            src="/images/assets/bass-clown-co-fish-chase.png" // Placeholder, ideally a specific image for this service
            alt="Strategic Brand Development"
            fill
            className="object-cover saturate-100 contrast-50 brightness-200"
            sizes="(max-width: 768px) 100vw, 1200px"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent flex items-center">
            <div className="text-cream p-8 md:p-16 max-w-lg md:max-w-xl">
              <h2 className="text-3xl md:text-4xl font-phosphate title-text mb-4 text-shadow-md">Strategic Brand Development</h2>
              <p className="mb-6 text-cream/90 leading-relaxed">
                From establishing new fishing brands to launching innovative products,
                our strategic video content helps you connect with your target audience.
              </p>
            </div>
          </div>
        </div>
        
        {/* Services Grid */}
        <div className="mb-16 md:mb-24">
          <h2 className="text-3xl md:text-4xl font-phosphate title-text text-cream mb-10 md:mb-12 text-center text-shadow-md">Our Branding Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => {
              const Icon = service.icon;
              return (
                <div key={index} className="bg-[#2D2D2D] p-6 rounded-lg shadow-xl hover:shadow-2xl transition-shadow flex flex-col">
                  <div className="bg-red-600/20 p-3 rounded-full w-fit mb-5 self-start">
                    <Icon className="h-7 w-7 text-red-400" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-phosphate title-text text-cream mb-3">{service.title}</h3>
                  <p className="text-cream/80 leading-relaxed flex-grow">{service.description}</p>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Process Timeline */}
        <div className="bg-[#2D2D2D] p-8 md:p-12 rounded-lg mb-16 md:mb-24 shadow-xl">
          <h2 className="text-3xl md:text-4xl font-phosphate title-text text-cream mb-10 md:mb-12 text-center text-shadow-md">Our Development Process</h2>
          <div className="max-w-3xl mx-auto">
            <ol className="relative border-l-2 border-slate-700">
              {[
                { title: "Discovery & Strategy", description: "We begin with a deep dive into your brand, target audience, and goals to develop a strategic foundation." },
                { title: "Creative Concept Development", description: "Our creative team develops unique concepts that align with your brand's values and objectives." },
                { title: "Production & Execution", description: "Using our industry expertise, we produce high-quality video content that brings your brand story to life." },
                { title: "Launch & Optimization", description: "We help deploy your content strategically and analyze performance to optimize future efforts." }
              ].map((item, index) => (
                <li key={index} className={`mb-10 ml-8 ${index === 3 ? 'pb-0 mb-0' : ''}`}>
                  <div className="absolute w-10 h-10 bg-red-600 rounded-full -left-[21px] flex items-center justify-center ring-4 ring-[#2D2D2D]">
                    <span className="text-white text-sm font-bold">{index + 1}</span>
                  </div>
                  <h3 className="text-xl md:text-2xl font-phosphate title-text text-cream">{item.title}</h3>
                  <p className="text-cream/80 mt-2 leading-relaxed">{item.description}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
        
        {/* Case Studies / Success Stories */}
        <div className="mb-16 md:mb-24">
          <h2 className="text-3xl md:text-4xl font-phosphate title-text text-cream mb-10 md:mb-12 text-center text-shadow-md">Success Stories</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {caseStudies.map((study, index) => (
              <div key={index} className="relative h-96 rounded-lg overflow-hidden group shadow-xl">
                <Image
                  src={study.image}
                  alt={study.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105 saturate-100 contrast-100 brightness-200"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col justify-end">
                  <div className="p-6 md:p-8">
                    <h3 className="text-2xl md:text-3xl font-phosphate title-text text-white mb-2 text-shadow-sm">{study.title}</h3>
                    <p className="text-white/90 leading-relaxed text-shadow-sm">{study.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <CTASection />
    </main>
  );
}
