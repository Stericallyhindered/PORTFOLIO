"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import BassFishy from "../BassFishy";
import Bubbles from "../Bubbles";
import PolaroidFrame from "./PolaroidFrame";
import { useVideoModal } from "@/lib/video-modal-context";

export const MediaCompanySection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const { openVideoModal } = useVideoModal();

  const handlePlayClick = () => {
    openVideoModal({
      videoSrc: "https://blo3rw5wwgi5exel.public.blob.vercel-storage.com/videos/f8-lifted-tournement.mp4",
      title: "F48 Lifted Trucks Tournament",
      description: "Professional bass fishing tournament coverage",
      category: "Tournament",
    });
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("show");
          }
        });
      },
      { threshold: 0.1 }
    );

    const elements = document.querySelectorAll(".fade-in");
    elements.forEach((element) => observer.observe(element));

    return () => {
      elements.forEach((element) => observer.unobserve(element));
    };
  }, []);

  return (
    <section 
      id="about-us" 
      className="py-12 md:py-24 bg-[#333132] flex flex-col items-center justify-center"
      ref={sectionRef}
    >
      <div className="container mx-auto px-4">
        <div className="flex flex-row gap-1 items-center justify-center">
          <h2 className="flex flex-col gap-1 items-center justify-center text-2xl sm:text-3xl text-center md:text-5xl mb-8 md:mb-12 uppercase text-cream title-text tracking-widest text-shadow-sm">
            <span >A MEDIA COMPANY</span>
            <span >With A <span className="text-primary font-bold"> 'CATCH' </span> OF HUMOR!</span>
          </h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12 items-center">
          {/* Left Column - Polaroid Video */}
          <div className="flex justify-center lg:justify-end relative order-2 lg:order-1">
          <Bubbles className="mx-auto opacity-75 transform rotate-12 scale-x-[-1] absolute top-0 left-0 translate-x-[-33%] translate-y-[-33%] z-0 hidden md:block" width={500} height={500} />
            <div className="relative fade-in opacity-0 translate-y-8" style={{ transform: "rotate(3deg)" }}>
              

              <PolaroidFrame
                    videoSrc="https://blo3rw5wwgi5exel.public.blob.vercel-storage.com/videos/f8-lifted-tournement.mp4"
                    videoAlt="F48 Lifted Trucks Tournament"
                    caption="F48 Lifted Trucks Tournament"
                    bgColor="bg-polaroid"
                    rotation="2deg"
                  >
                    {/* Play button */}
                    <div 
                      className="bg-red-600 rounded-full p-2 md:p-3 cursor-pointer hover:bg-red-700 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlayClick();
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white md:w-6 md:h-6">
                        <polygon points="5 3 19 12 5 21 5 3" fill="white"></polygon>
                      </svg>
                    </div>
                  </PolaroidFrame>  
            </div>
          </div>
          
          {/* Right Column - Text Content */}
          <div className="fade-in opacity-0 translate-y-8 text-phosphate text-lg md:text-xl lg:col-span-2 order-1 lg:order-2">

            <p className="text-white mb-4 md:mb-6">
              Welcome to Bass Clown Co., where we create engaging video content that catches attention just like the perfect lure. In today's crowded media landscape, there's no room for boring, dull brands that fail to make an impression.
            </p>
            
            <p className="text-white mb-4 md:mb-6">
              Our award-winning team of writers, directors, editors, and animators specializes in creating memorable content that resonates with your audience. We understand the fishing and outdoors industry inside and out, giving us the unique ability to speak authentically to your customers.
            </p>
            
            <p className="text-white">
              If you're looking to stand out in a sea of sameness, you need a media agency that knows how to get you noticed. That's what we do best - creating content that's impossible to ignore.
            </p>
          </div>
        </div>
        
        {/* Bass fish illustration */}
        <div className="mt-2 md:-mt-2 relative">
          <div className="flex flex-row items-center justify-center relative">
            <div className="border-t-4 border-dotted w-1/2 relative z-0"/>
            <BassFishy className="opacity-75 h-1/2 w-3/4 text-black max-w-[250px] md:max-w-none" />
            <div className="border-t-4 border-dotted w-1/2 relative z-0"/>
          </div>

        </div>
      </div>

    </section>
  );
};
