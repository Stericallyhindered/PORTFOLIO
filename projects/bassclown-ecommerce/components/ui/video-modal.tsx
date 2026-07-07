"use client";

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import FilmSpoolSimplified from '../icons/FilmSpoolSimplified';

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoSrc: string;
  title: string;
  description?: string;
  category?: string;
  duration?: string;
  className?: string;
}

export const VideoModal: React.FC<VideoModalProps> = ({
  isOpen,
  onClose,
  videoSrc,
  title,
  description,
  category,
  duration,
  className = "",
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`max-w-5xl !bg-[#323132] w-full pt-4 pb-2 px-2 md:px-4 bg-black ${className}`}>
        <DialogTitle className="sr-only">
          {title}
        </DialogTitle>
        
        <div className="relative">
          {/* Video Player */}
          <div className="relative aspect-video bg-black">
            {videoSrc && (
              <video
                controls
                autoPlay
                className="w-full h-full object-contain border-4 border-gray-400"
                preload="metadata"
              >
                <source src={videoSrc} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            )}
          </div>
          
          {/* Information Overlay at Bottom */}
          <div className="bg-gradient-to-t from-[#323132]/90 via-[#323132]/70 to-transparent py-2">
            <div className="grid grid-cols-1 md:grid-cols-3 w-full place-items-center border border-gray-400 gap-4 md:gap-0 pb-4 md:pb-0">
                <h3 className="text-primary text-xl drop-shadow-lg flex items-center gap-2 title-text">
                <FilmSpoolSimplified className="w-12 h-fit text-[#757573]" />
                  {title}
                </h3>
                {description && (
                  <p className="text-gray-300 text-xs text-center md:text-sm drop-shadow-lg">
                    {description}
                  </p>
                )}
                <div className="flex items-center gap-4">
                  {category && (
                    <span className="bg-primary text-white px-2 py-1 text-md font-bold rounded !font-bass-clown-cursive">
                      {category}
                    </span>
                  )}
                  {duration && (
                    <span className="text-gray-400 text-xs">
                      {duration}
                    </span>
                  )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VideoModal;