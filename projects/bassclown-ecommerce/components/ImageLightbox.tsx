"use client";

import { useEffect } from "react";
import Image from "next/image";
import { Project } from "@/lib/types";
import { cn } from "@/lib/utils";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface ImageLightboxProps {
  projects: Project[];
  currentIndex: number;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
}

export const ImageLightbox = ({
  projects,
  currentIndex,
  onClose,
  onNext,
  onPrev,
}: ImageLightboxProps) => {
  const currentProject = projects[currentIndex];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onNext();
      if (e.key === "ArrowLeft") onPrev();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "auto";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, onNext, onPrev]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-full bg-slate-800/50 text-white hover:bg-slate-700/50 transition-colors"
        aria-label="Close lightbox"
      >
        <X className="h-6 w-6" />
      </button>

      <button
        onClick={onPrev}
        className="absolute left-4 p-2 rounded-full bg-slate-800/50 text-white hover:bg-slate-700/50 transition-colors"
        aria-label="Previous image"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>

      <button
        onClick={onNext}
        className="absolute right-4 p-2 rounded-full bg-slate-800/50 text-white hover:bg-slate-700/50 transition-colors"
        aria-label="Next image"
      >
        <ChevronRight className="h-6 w-6" />
      </button>

      <div className="max-w-5xl w-full">
        <div className="relative w-full h-[70vh]">
          <Image
            src={currentProject.image}
            alt={currentProject.title}
            fill
            className="object-contain"
            sizes="100vw"
          />
        </div>

        <div className="bg-slate-800/70 p-5 mt-4 rounded-lg">
          <h3 className="text-xl font-semibold text-white mb-2">
            {currentProject.title}
          </h3>
          <span className="inline-block bg-orange-500 text-white text-xs font-medium px-2.5 py-1 rounded-full mb-3">
            {currentProject.category}
          </span>
          <p className="text-slate-200">{currentProject.description}</p>
        </div>
      </div>
    </div>
  );
};