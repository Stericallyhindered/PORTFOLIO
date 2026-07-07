"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";

export const PartnersSection = () => {
  const sectionRef = useRef<HTMLElement>(null);

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

    const elements = document.querySelectorAll(".partner-logo");
    elements.forEach((element) => observer.observe(element));

    return () => {
      elements.forEach((element) => observer.unobserve(element));
    };
  }, []);

  // Generate partner logo placeholders (3 rows, 6 columns)
  const partnerLogos = Array.from({ length: 18 }).map((_, index) => {
    const row = Math.floor(index / 6) + 1;
    const col = (index % 6) + 1;
    return { id: `partner-${row}-${col}`, row, col };
  });

  return (
    <section id="partners" className=" bg-[#1D1D1F] relative flex flex-col items-center" ref={sectionRef}>
      <div className="absolute -top-10 left-0 w-full z-0">
        <Image src="/images/assets/video-reel-1.svg" 
          alt="Film Reel" 
          width={2560}
          height={44}
          className="object-cover" />
      </div>
      <div className="absolute -top-12 md:-top-20 w-fit z-0 flex justify-center mb-8 md:mb-16">
        <Image src="/images/assets/partner-ellipse.svg" 
          alt="Partners We Have Hooked!" 
          width={500}
          height={250}
          className="object-fill z-10 md:w-[700px]" />
      </div>

      {/* Top wavy divider with stitches */}
      <div className="container mx-auto px-4">

        {/* Partner Logos Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 md:gap-6 max-w-6xl mx-auto mt-16 md:mt-24">
          {partnerLogos.map((logo) => (
            <div 
              key={logo.id} 
              className={`partner-logo opacity-0 translate-y-4 flex items-center justify-center p-2 md:p-4 transition-all duration-300 delay-${(logo.row - 1) * 3 + logo.col}`}
            >
                <Image src="/images/bass-clown-co-logo-cream.svg" 
                  alt="Bass Clown Co. Logo" 
                  width={1280}
                  height={22}
                  className="object-cover md:w-[2560px]" 
                />
            </div>
          ))}
        </div>
      </div>

      <div className="relative h-6 w-full mt-8 md:mt-12">
        <div className="absolute inset-0">
          <div className="absolute -top-5 left-0 w-full z-10">
            <Image src="/images/assets/video-reel-1.svg" 
              alt="Film Reel" 
              width={2560}
              height={44}
              className="object-cover" />
          </div>
        </div>
      </div>

      <style jsx>{`
        .partner-logo {
          transition-delay: calc(0.05s * var(--delay));
        }
        
        .partner-logo.show {
          opacity: 1;
          transform: translateY(0);
        }
        
        .wavy-path {
          filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.1));
        }
      `}</style>
    </section>
  );
};
