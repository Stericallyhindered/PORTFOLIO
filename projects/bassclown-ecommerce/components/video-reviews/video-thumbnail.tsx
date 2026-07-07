import { Play } from "lucide-react"
import Image from "next/image"

interface VideoThumbnailProps {
    title: string;
    author: string;
    imageSrc: string;
    imageAlt: string;
    videoUrl?: string;
}

export const VideoThumbnail = ({ title, author, imageSrc, imageAlt, videoUrl }: VideoThumbnailProps) => {
    return (
        <div className="relative rounded-lg overflow-hidden h-64 bg-gray-700 group">
            <div className="absolute inset-0 bg-black/20 z-10"></div>
            <div className="absolute top-4 right-4 z-30">
                <div className="text-white font-bold text-xl" style={{textShadow: "1px 1px 3px rgba(0,0,0,0.8)"}}>
                    {title}
                </div>
                <div className="text-white text-sm" style={{textShadow: "1px 1px 2px rgba(0,0,0,0.8)"}}>
                    {author}
                </div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center z-20">
                <div className="bg-red-600 rounded-full w-16 h-16 flex items-center justify-center">
                    <Play className="h-8 w-8 text-white ml-1" />
                </div>
            </div>
            {/* Video Thumbnail */}
            <Image
                src={imageSrc}
                alt={imageAlt}
                fill
                className="object-contain p-6 transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 33vw"
            />
            {/* Video  */}
            {videoUrl && (
                <video
                    src={videoUrl}
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="object-contain p-6 transition-transform duration-300 group-hover:scale-105"
                />
            )}
      </div>
    )
}