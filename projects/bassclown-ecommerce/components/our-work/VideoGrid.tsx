"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useVideoModal } from "@/lib/video-modal-context";

interface VideoItem {
  id: string;
  title: string;
  videoUrl: string;
  thumbnailUrl?: string;
  thumbnail?: string; // Make thumbnail optional since we'll generate it
}

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
          // Set canvas dimensions to a standard 16:9 aspect ratio for consistency
          const targetWidth = 640;
          const targetHeight = 360; // 16:9 ratio
          canvas.width = targetWidth;
          canvas.height = targetHeight;
          
          // Seek to 2 seconds or 10% of video duration, whichever is smaller
          const seekTime = Math.min(2, video.duration * 0.1);
          video.currentTime = seekTime;
        };

        video.onseeked = () => {
          try {
            // Draw video frame with cover behavior (fill entire canvas, may crop)
            const videoAspect = video.videoWidth / video.videoHeight;
            const canvasAspect = canvas.width / canvas.height;
            
            let coverWidth, coverHeight, coverX, coverY;
            
            // Fill background with black
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            if (videoAspect > canvasAspect) {
              // Video is wider - fit to height and crop width
              coverHeight = canvas.height;
              coverWidth = canvas.height * videoAspect;
              coverX = (canvas.width - coverWidth) / 2;
              coverY = 0;
            } else {
              // Video is taller - fit to width and crop height
              coverWidth = canvas.width;
              coverHeight = canvas.width / videoAspect;
              coverX = 0;
              coverY = (canvas.height - coverHeight) / 2;
            }
            
            ctx.drawImage(video, coverX, coverY, coverWidth, coverHeight);
            
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

// Video thumbnail component
const VideoThumbnail = ({ video }: { video: VideoItem }) => {
  const { thumbnail, isLoading, error } = useVideoThumbnail(video.videoUrl);

  if (error) {
    // Fallback to static placeholder on error
    return (
      <Image
        src="/images/assets/video-reel-1.svg"
        alt={video.title}
        fill
        className="object-cover"
      />
    );
  }

  if (isLoading) {
    // Show loading state
    return (
      <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  if (thumbnail) {
    return (
      <Image
        src={thumbnail}
        alt={video.title}
        fill
        className="object-cover bg-black"
        unoptimized // Since we're using blob URLs
      />
    );
  }

  // Fallback
  return (
    <Image
      src="/images/assets/video-reel-1.svg"
      alt={video.title}
      fill
      className="object-cover"
    />
  );
};

export const VideoGrid = () => {
  const videoRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/portfolio/videos?published=true', {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch videos');
      }

      const result = await response.json();

      if (result.success && result.data?.videos) {
        const transformedVideos: VideoItem[] = result.data.videos.map((video: any) => ({
          id: video.id,
          title: video.title,
          videoUrl: video.videoUrl,
          thumbnailUrl: video.thumbnailUrl
        }));

        setVideos(transformedVideos);
      }
    } catch (error) {
      console.error('Error fetching videos:', error);
      // Fallback to empty array - videos will just be empty
      setVideos([]);
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

    videoRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => {
      videoRefs.current.forEach((ref) => {
        if (ref) observer.unobserve(ref);
      });
    };
  }, [videos]);

  const { openVideoModal } = useVideoModal();

  const handlePlayClick = (video: VideoItem) => {
    openVideoModal({
      videoSrc: video.videoUrl,
      title: video.title,
      description: "Bass Clown Co. Production",
      category: "Commercial",
    });
  };

  if (loading) {
    return (
      <section className="bg-black py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="animate-pulse bg-gray-800 h-64 rounded"></div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (videos.length === 0) {
    return (
      <section className="bg-black py-16">
        <div className="container mx-auto px-4">
          <div className="text-center text-white">
            <p className="text-xl">No videos available yet. Check back soon!</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="bg-black py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {videos.map((video, index) => (
              <div
                key={video.id || index}
                ref={(el) => {
                  videoRefs.current[index] = el;
                }}
                className="project-card bg-black overflow-hidden"
              >
                {/* Video thumbnail with play button - fixed aspect ratio */}
                <div className="relative aspect-video bg-black w-full">
                  <VideoThumbnail video={video} />
                  <button
                    onClick={() => handlePlayClick(video)}
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10"
                    aria-label={`Play ${video.title}`}
                  >
                    <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center transition-transform hover:scale-110">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="white"
                        className="w-6 h-6"
                        style={{ marginLeft: "2px" }}
                      >
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </button>
                </div>

                {/* Video title only - description removed */}
                <div className="p-4">
                  <h3 className="text-xl md:text-3xl font-thin text-center text-white mb-2 title-text">{video.title}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};
