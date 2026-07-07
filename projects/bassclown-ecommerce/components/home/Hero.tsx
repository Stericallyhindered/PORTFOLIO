"use client";

import Image from "next/image";
import Link from "next/link";
import { Play } from "lucide-react";
import HookLine from "../HookLine";
import { IoPlayCircleSharp } from "react-icons/io5";


export const Hero = () => {
  return (
    <section 
      id="home" 
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-slate-900"
    >
    <HookLine
          size={100}
          color="#ECE9D9"
          className="absolute top-0 left-1/2 -translate-x-1/2 z-[1] opacity-80 hidden md:block animate-reelItIn ease-in-out"
        />
      <HookLine
          size={100}
          color="#ECE9D9"
          className="absolute top-0 left-1/2 z-[1] opacity-50 block md:hidden animate-reelItIn ease-in-out"
        />
      {/* Background video */}
      <div className="absolute inset-0 z-0 aspect-square md:aspect-video">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute top-1/2 left-1/2 w-full h-full -translate-x-1/2 -translate-y-1/2 object-cover pointer-events-none"
          style={{
            minWidth: '100%',
            minHeight: '100%',
          }}
        >
          <source src="https://blo3rw5wwgi5exel.public.blob.vercel-storage.com/videos/bass-clown-hero.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-black/50 z-10 "></div>
      </div>
      
      <div className="container mx-auto px-4 relative z-20 flex flex-col md:flex-row items-center place-self-center justify-between md:py-24">
        <div className="w-full text-left md:mb-16 md:mb-0">

          <div className="text-shadow-sm flex flex-col gap-4 items-center justify-center">
            <h1 className="flex flex-col md:flex-row gap-4 md:gap-20 items-center justify-center tracking-widest text-cream">
              <span className="title-text text-3xl sm:text-4xl md:text-5xl text-center md:text-left">Our Reels Catch</span>
              <span className="title-text text-3xl sm:text-4xl md:text-5xl text-center md:text-right">The Most Action!</span>
            </h1>
            
            <p className="text-base sm:text-lg md:text-xl text-cream mb-8 text-phosphate text-center md:text-left max-w-6xl">
              BOOST YOUR BRAND with of our "Over The Top" video productions designed for the fishing industry!
            </p>
          </div>

        </div>

        {/* Right side content - Video placeholder
        <div className="w-full md:w-1/3 relative">
          {/* Video placeholder 
          <div className="relative aspect-video bg-black/30 rounded-lg border border-white/20 shadow-xl">
            <Image
              src="/images/assets/bass-clown-co-fish-chase.png"
              alt="Featured video"
              fill
              className="object-cover rounded-lg opacity-80"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
            
            {/* Play button 
            <div className="absolute inset-0 flex items-center justify-center z-20">
              <div className="bg-red-600 rounded-full p-4 cursor-pointer hover:bg-red-700 transition-colors">
                <Play className="h-8 w-8 text-white" fill="white" />
              </div>
            </div>
          </div>
          */}
        
      </div>
      <div className="flex flex-col md:flex-row gap-4 md:gap-8 items-center bg-primary w-full md:w-fit px-4 md:pr-8 py-4 md:pl-16 absolute bottom-40 md:bottom-40 left-0 md:left-0 z-30">
            <div className="flex justify-center md:justify-start">
              <Image 
                src="/images/bass-clown-co-logo-cream.svg" 
                alt="Bass Clown Co Logo" 
                width={150} 
                height={60}
                className="md:w-[200px] md:h-[80px]"
              />
            </div>
            <div className="hidden md:flex flex-col gap-0.5 items-center justify-center">
              {Array.from({ length: 20 }).map((_, i) => (
                <svg key={i} width="4" height="4" viewBox="0 0 8 8" fill="none">
                  <circle cx="4" cy="4" r="3" fill="#EEEBDC" />
                </svg>
              ))}
            </div>
            <div>
              <div className="flex flex-col gap-2 md:gap-4 items-center justify-center">
                <h3 className="text-white text-phosphate font-bold text-xs sm:text-sm uppercase text-center">
                  Become a Bass Clown Member!
                </h3>
              <Link 
                href="/contact" 
                className="inline-block bg-[#C21B21] hover:bg-red-700 text-white font-bold py-2 md:py-3 px-4 md:px-8 rounded-xs border-[#EEEBDC] border transition-colors cursor-pointer text-sm md:text-base"
              >
                CLICK HERE
              </Link>
              </div>
            </div>
        </div>
      {/* Bottom wavy border - film strip style but thicker and more pronounced */}
      <div className="absolute -bottom-12 left-0 w-full z-10 hidden md:block">
        <Image src="/images/assets/video-reel-1.svg" 
          alt="Video reel" 
          width={2560}
          height={22}
          className="object-cover" />
      </div>
      <div className="absolute bottom-0 left-0 w-full z-10 block md:hidden">
        <Image src="/images/assets/video-reel-1.svg" 
          alt="Video reel" 
          width={1280}
          height={22}
          className="scale-[650%]" />
      </div>
    </section>
  );
};
