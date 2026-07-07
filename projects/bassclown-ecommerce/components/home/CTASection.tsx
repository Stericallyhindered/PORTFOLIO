"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import WeatheredBurst from "@/components/icons/WeatheredBurst";
import Image from "next/image";

export const CTASection = () => {
  const buttonRef = useRef<HTMLDivElement>(null);

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

    if (buttonRef.current) {
      observer.observe(buttonRef.current);
    }

    return () => {
      if (buttonRef.current) {
        observer.unobserve(buttonRef.current);
      }
    };
  }, []);

  return (
    <section id="cta" className="pt-24 pb-48 bg-black relative">
      <div className="container mx-auto px-4 text-center">
        <p className="text-white text-xl md:text-2xl mb-24 max-w-3xl mx-auto font-phosphate title-text">
          Let Us Bring To Life Your Next Big Commercial Or Reel. Click The Link Below To Get Started!
        </p>
        
        <div 
          ref={buttonRef}
          className="relative inline-block opacity-0 transform translate-y-8 transition-all duration-1000 ease-in-out"
        >
          {/* Radiating lines - positioned behind with lower z-index */}
          <div className="absolute -inset-10 flex items-center justify-center z-0 pointer-events-none">
            <div className="relative">
             <WeatheredBurst size={450} className="text-white/60 animate-pulse opacity-60 ease-in-out transition-opacity z-0" />
            </div>
          </div>
          
          {/* Button - positioned above with higher z-index */}
          <Link href="/contact" className="relative z-10">
            <Button 
              className="bg-red-600 hover:bg-red-700 text-white text-lg md:text-xl font-bass-clown-cursive px-10 py-6 rounded-md shadow-lg transition-transform hover:scale-105 relative z-10"
            >
              Let&rsquo;s Work Together!
            </Button>
          </Link>
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0% {
            opacity: 0.3;
            transform: scale(0.95);
          }
          50% {
            opacity: 0.5;
            transform: scale(1);
          }
          100% {
            opacity: 0.3;
            transform: scale(0.95);
          }
        }
        
        .animate-pulse {
          animation: pulse 2s infinite;
        }
        
        .show {
          opacity: 1 !important;
          transform: translateY(0) !important;
        }
      `}</style>
    </section>
  );
};
