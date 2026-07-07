"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { PiFilmReelFill } from "react-icons/pi";
import NonHomePolaroidFrame from "@/components/NonHomePolaroidFrame";
import FilmSpoolSimplified from "./icons/FilmSpoolSimplified";

interface ServiceBlockCardProps {
  title: string;
  description: string;
  bannerColor: string;
  polaroidImage?: string;
  polaroidVideo?: string;
  polaroidCaption: string;
  icon: string;
  index: number;
  expandedDescription?: string;
}

export const ServiceBlockCard = ({ 
  title, 
  description, 
  bannerColor, 
  polaroidImage, 
  polaroidVideo,
  polaroidCaption, 
  icon,
  index,
  expandedDescription
}: ServiceBlockCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const expandedRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Process the description to handle the possibility of having multiple paragraphs
  const descriptionParagraphs = description.split('\n\n');
  const initialDescription = descriptionParagraphs[0];

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div 
      ref={cardRef}
      className={cn(
        "service-block mb-24 opacity-100 translate-y-0 relative",
        isExpanded ? "z-[100]" : "z-10"
      )} 
      style={{ transitionDelay: `${index * 0.1}s` }}
    >
      <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-6 place-items-center">
        {/* Polaroid Image */}
        <div className="lg:col-span-4">
          <div className="relative w-full max-w-sm mx-auto md:mx-0 transform rotate-1 transition-transform hover:rotate-0">
             <NonHomePolaroidFrame
                  imageSrc={polaroidImage}
                  videoSrc={polaroidVideo}
                  imageAlt={title}
                  videoAlt={title}
                  caption={polaroidCaption}
                  bgColor="bg-polaroid"
                  rotation={`3deg`}
                  width={320}
                />
          </div>
        </div>
       
        {/* Content */}
        <div className="lg:col-span-8">
          {/* Title Banner */}
          <div 
            className={cn(
              "relative flex items-center rounded-r-lg py-3 pl-6 pr-12 mb-4",
              bannerColor === "orange" ? "bg-amber-600" : "bg-blue-700"
            )}
          >
            <h3 className="text-lg md:text-2xl font-bold text-white uppercase">{title}</h3>
            
            {/* Icon */}
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 rounded-full p-2">
            <FilmSpoolSimplified size={64} className="text-black !hidden md:!block" />
            <FilmSpoolSimplified size={48} className="text-black !block md:!hidden" />
            </div>
          </div>

          {/* Description */}
          <div className="text-white">
            <p className="mb-4">{initialDescription}</p>

            {/* More Information Button */}
            {expandedDescription && (
              <div 
                className="flex items-center justify-end cursor-pointer group"
                onClick={toggleExpanded}
              >
                <div className="bg-[#727274] px-4 py-2 flex items-center space-x-2 hover:bg-gray-700 transition-colors rounded">
                  <span className="text-sm uppercase text-gray-300">More Information</span>
                  <ChevronDown 
                    className={cn(
                      "h-4 w-4 text-red-500 transition-transform duration-300",
                      isExpanded ? "transform rotate-180" : ""
                    )} 
                  />
                </div>
              </div>
            )}
            {/* Expandable Overlay Section */}
            {expandedDescription && (
              <div 
                ref={expandedRef}
                className={cn(
                  "absolute left-0 right-0 bg-gradient-to-r from-[#38383A]/80 to-[#38383A] backdrop-blur-md border-2 border-red-500 rounded-lg shadow-2xl transition-all duration-500 ease-in-out overflow-hidden",
                  isExpanded 
                    ? "opacity-100 md:max-h-[600px] z-[9999] mt-4" 
                    : "opacity-0 max-h-0 z-0 mt-0"
                )}
                style={{
                  position: isExpanded ? 'absolute' : 'absolute',
                  zIndex: isExpanded ? 9999 : 0
                }}
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div 
                      className={cn(
                        "flex items-center px-4 py-2 rounded hidden md:flex",
                        bannerColor === "orange" ? "bg-amber-600" : "bg-blue-700"
                      )}
                    >
                      <h3 className="text-xl font-bold text-white uppercase">{title}</h3>
                    </div>
                    <button
                      onClick={() => setIsExpanded(false)}
                      className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded"
                    >
                      <X size={20} />
                    </button>
                  </div>

                               {/* Content Layout */}
             <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 h-full">
               {/* Fixed Polaroid Image */}
               <div className="md:col-span-1 flex items-center justify-center w-full h-full">
                 <div className="relative w-full max-w-[200px] mx-auto transform rotate-2">
                   <NonHomePolaroidFrame
                     imageSrc={polaroidImage}
                     videoSrc={polaroidVideo}
                     imageAlt={title}
                     videoAlt={title}
                     caption={polaroidCaption}
                     bgColor="bg-polaroid"
                     rotation={`2deg`}
                     width={200}
                   />
                 </div>
               </div>

               {/* Scrollable Content */}
               <div className="md:col-span-2 lg:col-span-3 max-h-[400px] overflow-y-auto service-block-scrollbar">
                 <div className="text-white space-y-4 pr-2">
                   <div className="space-y-4">
                     <h4 className="text-lg font-semibold text-amber-400 border-b border-gray-700 pb-2">
                       The Full Story
                     </h4>
                     {expandedDescription.split('\n\n').map((paragraph, idx) => (
                       <p key={idx} className="leading-relaxed text-gray-200">
                         {paragraph}
                       </p>
                     ))}
                   </div>

                   {/* Call to Action Section */}
                   <div className="mt-6 p-4 bg-[#1D1D20] rounded-lg border border-gray-700">
                     <h4 className="text-lg font-semibold text-white mb-3">Ready to Get Started?</h4>
                     <p className="text-gray-300 mb-4 text-sm">
                       Let's discuss how we can help bring your vision to life with our {title.toLowerCase()} services.
                     </p>
                     <div className="flex flex-wrap justify-center gap-3">
                       <Link href="/contact" className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded text-sm transition-colors inline-block">
                         Get Quote
                       </Link>
                       <Link href="/our-work" className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded text-sm transition-colors inline-block">
                         View Portfolio
                       </Link>
                       <Link href="/about" className="border border-gray-600 hover:border-gray-500 text-gray-300 hover:text-white px-4 py-2 rounded text-sm transition-colors inline-block">
                         Learn More
                       </Link>
                     </div>
                   </div>
                 </div>
               </div>
             </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
