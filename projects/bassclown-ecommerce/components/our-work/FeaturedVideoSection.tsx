"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

// Custom hook for generating video thumbnails
const useVideoThumbnail = (videoUrl: string) => {
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const generateThumbnail = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const video = document.createElement('video');
        video.crossOrigin = 'anonymous';
        video.preload = 'metadata';
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          throw new Error('Could not get canvas context');
        }

        video.onloadedmetadata = () => {
          // Set canvas dimensions to a standard aspect ratio (16:9) for consistency
          const targetWidth = 1280;
          const targetHeight = 720;
          canvas.width = targetWidth;
          canvas.height = targetHeight;
          
          // Seek to 2 seconds or 10% of video duration, whichever is smaller
          const seekTime = Math.min(2, video.duration * 0.1);
          video.currentTime = seekTime;
        };

        video.onseeked = () => {
          try {
            // Calculate scaling to fit video within canvas (contain behavior)
            const videoAspect = video.videoWidth / video.videoHeight;
            const canvasAspect = canvas.width / canvas.height;
            
            let drawWidth, drawHeight, drawX, drawY;
            
            if (videoAspect > canvasAspect) {
              // Video is wider than canvas
              drawWidth = canvas.width;
              drawHeight = canvas.width / videoAspect;
              drawX = 0;
              drawY = (canvas.height - drawHeight) / 2;
            } else {
              // Video is taller than canvas
              drawHeight = canvas.height;
              drawWidth = canvas.height * videoAspect;
              drawX = (canvas.width - drawWidth) / 2;
              drawY = 0;
            }
            
            // Fill background with black
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Draw video frame with proper scaling (contain behavior)
            ctx.drawImage(video, drawX, drawY, drawWidth, drawHeight);
            
            // Convert canvas to blob URL
            canvas.toBlob((blob) => {
              if (blob) {
                const thumbnailUrl = URL.createObjectURL(blob);
                setThumbnail(thumbnailUrl);
              } else {
                setError('Failed to generate thumbnail');
              }
              setIsLoading(false);
            }, 'image/jpeg', 0.8);
          } catch (err) {
            setError('Failed to capture video frame');
            setIsLoading(false);
          }
        };

        video.onerror = () => {
          setError('Failed to load video');
          setIsLoading(false);
        };

        video.src = videoUrl;
      } catch (err) {
        setError('Failed to generate thumbnail');
        setIsLoading(false);
      }
    };

    generateThumbnail();

    // Cleanup function to revoke blob URLs
    return () => {
      if (thumbnail) {
        URL.revokeObjectURL(thumbnail);
      }
    };
  }, [videoUrl]);

  return { thumbnail, isLoading, error };
};

export const FeaturedVideoSection = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoUrl = "https://blo3rw5wwgi5exel.public.blob.vercel-storage.com/videos/bass-clown-hero.mp4";
  const { thumbnail, isLoading, error } = useVideoThumbnail(videoUrl);
  
  const handlePlayClick = () => {
    setIsPlaying(true);
  };
  
  return (
    <section className="relative w-full bg-black aspect-video">
      {/* Background thumbnail or fallback - only shown when video is not playing */}
      {!isPlaying && (
        <div className="absolute inset-0">
          {isLoading ? (
            // Loading state
            <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white"></div>
            </div>
          ) : error ? (
            // Error fallback - use original static image
            <>
              <Image
                src="/images/assets/bass-clown-co-fish-chase.png"
                alt="Featured video background"
                fill
                className="object-cover object-top"
                priority
                style={{ objectPosition: '50% 20%' }}
              />
              <div className="absolute inset-0 bg-black/30"></div>
            </>
          ) : thumbnail ? (
            // Video thumbnail
            <>
              <Image
                src={thumbnail}
                alt="Video thumbnail"
                fill
                className="object-cover"
                unoptimized // Since we're using blob URLs
              />
              <div className="absolute inset-0 bg-black/20"></div>
            </>
          ) : (
            // Final fallback
            <>
              <Image
                src="/images/assets/bass-clown-co-fish-chase.png"
                alt="Featured video background"
                fill
                className="object-cover object-top"
                priority
                style={{ objectPosition: '50% 20%' }}
              />
              <div className="absolute inset-0 bg-black/30"></div>
            </>
          )}
        </div>
      )}
      
      {/* Play button - only shown when video is not playing */}
      {!isPlaying && (
        <button 
          onClick={handlePlayClick}
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10"
          aria-label="Play video"
        >
          <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center transition-transform hover:scale-110">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill="white" 
              className="w-10 h-10"
              style={{ marginLeft: "3px" }} // Slight adjustment for the play icon
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </button>
      )}
      
      {/* Video player - shown when video is playing */}
      {isPlaying && (
        <div className="absolute inset-0">
          <video
            controls
            autoPlay
            className="w-full h-full object-contain"
            style={{ objectPosition: '50% 20%' }}
            preload="metadata"
          >
            <source src={videoUrl} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      )}
    </section>
  );
};
