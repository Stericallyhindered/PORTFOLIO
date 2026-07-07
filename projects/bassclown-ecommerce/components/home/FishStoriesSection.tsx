"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import PolaroidFrame from "./PolaroidFrame";
import { PiFilmReelFill } from "react-icons/pi";
import FancyBurst from "@/components/icons/FancyBurst";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import FilmSpoolSimplified from "../icons/FilmSpoolSimplified";
import WeatheredBurst from "../icons/WeatheredBurst";

interface FeaturedVideo {
  id: string;
  title: string;
  description?: string;
  videoUrl: string;
  thumbnailUrl?: string;
  clientName?: string;
}

export const FishStoriesSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const [featuredVideos, setFeaturedVideos] = useState<FeaturedVideo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedVideos();
  }, []);

  const fetchFeaturedVideos = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/portfolio/videos?featured=true&limit=3&published=true', {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch featured videos');
      }

      const result = await response.json();

      if (result.success && result.data?.videos) {
        setFeaturedVideos(result.data.videos);
      }
    } catch (error) {
      console.error('Error fetching featured videos:', error);
      // Fallback to empty array - will show empty state
      setFeaturedVideos([]);
    } finally {
      setLoading(false);
    }
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

    const elements = document.querySelectorAll(".fish-story");
    elements.forEach((element) => observer.observe(element));

    return () => {
      elements.forEach((element) => observer.unobserve(element));
    };
  }, [featuredVideos]);

  return (
    <section 
      id="our-work" 
      className="py-12 md:pb-24 bg-[#333132] relative"
      ref={sectionRef}
    >
      <div className="absolute inset-10 flex items-center justify-center z-0 pointer-events-none">
        <div className="relative">
          <WeatheredBurst size={1800} className="text-zinc-400/5 hidden md:block" />
        </div>
      </div>
      <div className="container mx-auto px-4">
        {/* Video Player
        <div className="mb-12 md:mb-20 relative fade-in fish-story opacity-0 translate-y-8">
          <div className="max-w-4xl mx-auto bg-slate-800 rounded-lg overflow-hidden shadow-2xl">
{/*             Video Display 
            <div className="relative aspect-video">
              <video
                className="w-full h-full object-cover"
                controls
                preload="metadata"
                poster=""
              >
                <source src="https://blo3rw5wwgi5exel.public.blob.vercel-storage.com/videos/bass-clown-hero.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div> 
            
            {/* Title Bar
            <div className="px-4 md:px-6 py-3 md:py-4 bg-slate-900">
              <p className="text-white text-base md:text-lg font-medium">Stealth Lithium Batteries Commercial</p>
            </div>
          </div>
        </div> */}
        
        {/* Section Headline */}
        <div className="text-center mb-12 md:mb-16 fade-in fish-story opacity-0 translate-y-8">
          <h2 className="text-2xl sm:text-3xl title-text md:text-5xl mb-4 tracking-widest text-cream">
            FISH STORIES "R" SAFE WITH US... HECK WE'LL MAKE EM' BIGGER!
          </h2>
          <p className="text-lg md:text-xl text-white max-w-6xl mx-auto">
            Our Next Commercials Video Larger than Life... Here are Three of our Favorite Commercials We Have Produced!
          </p>
        </div>
        
        {/* Three Content Blocks */}
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-8 justify-between items-between">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse bg-gray-800 h-96 rounded"></div>
            ))}
          </div>
        ) : featuredVideos.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-8 justify-between items-between">
            {featuredVideos.slice(0, 3).map((video, index) => {
              const rotations = ['2deg', '-3deg', '3deg'];
              const rotation = rotations[index] || '0deg';
              return (
                <div key={video.id} className={`fish-story opacity-0 translate-y-8 flex flex-col justify-between h-full ${index === 1 ? 'lg:border-r-2 lg:border-dotted lg:border-l-2' : ''}`}>
                  <div className="flex justify-center mb-4 md:mb-6">
                    <div className="relative" style={{ transform: `rotate(${rotation})` }}>
                      {/* Polaroid frame */}
                      <div className="transform scale-90 md:scale-100">
                        <PolaroidFrame
                          videoSrc={video.videoUrl}
                          videoAlt={video.title}
                          caption={video.clientName || video.title}
                          bgColor="bg-polaroid"
                          rotation={rotation}
                        >
                          {/* Play button */}
                          <div 
                            className="bg-red-600 rounded-full p-2 md:p-3 cursor-pointer hover:bg-red-700 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white md:w-6 md:h-6">
                              <polygon points="5 3 19 12 5 21 5 3" fill="white"></polygon>
                            </svg>
                          </div>
                        </PolaroidFrame>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-center px-2 md:px-4">
                    <h3 className="text-xl md:text-2xl font-bold text-white mb-3">{video.title}</h3>
                    <p className="text-white mb-4 md:mb-6 text-sm md:text-base">
                      {video.description || 'Bass Clown Co. Production'}
                    </p>
                  </div>
                  <div className="flex flex-col items-center gap-4 md:gap-8 justify-end h-full">
                    <div className="flex justify-center items-center">
                      <Button className="bg-red-600 hover:bg-red-700 text-white px-4 md:px-6 py-2 rounded-none relative text-sm md:text-base">
                        LEARN MORE
                      </Button>
                    </div>
                    {/* Fishing reel icon */}
                    <div className="flex justify-center">
                      <FilmSpoolSimplified className="text-black" size={96} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center text-white py-12">
            <p className="text-xl">Featured videos coming soon!</p>
          </div>
        )}
      </div>

      {/* Video Modals */}

    </section>
  );
};
