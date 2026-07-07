"use client";
import Image from "next/image";
import React, { useRef } from "react";
import { useVideoModal } from "@/lib/video-modal-context";

interface PolaroidFrameProps {
  imageSrc?: string;
  videoSrc?: string;
  imageAlt?: string;
  videoAlt?: string;
  caption?: string;
  bgColor?: string;
  rotation?: string;
  width?: number | string;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

const NonHomePolaroidFrame: React.FC<PolaroidFrameProps> = ({
  imageSrc,
  videoSrc,
  imageAlt,
  videoAlt,
  caption,
  bgColor = "bg-polaroid", // default to new tailwind color
  rotation = "-3deg",
  width = 240,
  children,
  className = "",
  style = {},
}) => {
  const { openVideoModal } = useVideoModal();

  const handleFrameClick = () => {
    if (videoSrc) {
      openVideoModal({
        videoSrc,
        title: videoAlt || caption || "Video",
        description: "Bass Clown Co. Production",
        category: "Featured",
      });
    }
  };

  return (
    <>
      <div
        className={`relative translate-y-8 ${className} ${videoSrc ? 'cursor-pointer' : ''}`}
        style={{ transform: `rotate(${rotation})`, ...style }}
        {...(videoSrc ? { onClick: handleFrameClick } : {})}
      >
        {/* Polaroid frame */}
        <div className={`${bgColor} p-4 pt-4 pb-8 shadow-xl`} style={{ width }}>
          {/* Media placeholder */}
          <div className="relative aspect-square bg-black mb-4">
            {videoSrc ? (
              <>
                <video
                  className="w-full h-full object-contain bg-black p-0.5"
                  preload="metadata"
                  muted
                >
                  <source src={videoSrc} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
                {/* Play button overlay for video */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFrameClick();
                    }}
                    className="bg-black bg-opacity-50 text-white rounded-full p-4 hover:bg-opacity-70 transition-opacity"
                  >
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </button>
                </div>
                {/* Expand icon for video */}
                <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white rounded-full p-2 opacity-0 hover:opacity-100 transition-opacity">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
                  </svg>
                </div>
              </>
            ) : imageSrc ? (
              <>
                <Image
                  src={imageSrc}
                  alt={imageAlt || ""}
                  className="object-contain bg-black p-0.5"
                  fill
                  sizes="(max-width: 768px) 100vw, 240px]"
                />
                {/* Custom overlay (e.g. play button) */}
                {children && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    {children}
                  </div>
                )}
              </>
            ) : null}
          </div>
          {/* Caption */}
          {caption && (
            <p
              className="text-center text-slate-800 font-medium"
              style={{ fontFamily: "Comic Sans MS, cursive, sans-serif" }}
            >
              {caption}
            </p>
          )}
        </div>
        {/* Tape element */}
       {/*  <div className={`absolute -top-3 ${rotation === "-3deg" ? "right-1/2" : "right-1/3"} bg-gradient-to-r from-gray-100/30 to-gray-100/70 w-24 h-8 ${rotation === "-3deg" ? "rotate-12" : "-rotate-12"}`}></div> */}
       <Image src="/images/assets/polaroid-tape.svg" alt="tape" width={100} height={100} className={`absolute -top-5 ${rotation === "-3deg" ? "right-1/2" : "right-1/3"} ${rotation === "-3deg" ? "rotate-[30deg]" : "-rotate-[5deg]"}`} />
      </div>

    </>
  );
};

export default NonHomePolaroidFrame; 