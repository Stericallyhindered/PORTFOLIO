import { Play } from "lucide-react"
import Image from "next/image"

interface ContestVideoThumbnailProps {
    title: string;
    subtitle: string;
    imageSrc: string;
    imageAlt: string;
    videoUrl?: string;
}

export const ContestVideoThumbnail = ({ title, subtitle, imageSrc, imageAlt, videoUrl }: ContestVideoThumbnailProps) => {
    return (
        <div className="relative rounded-lg overflow-hidden group h-48">
            <div className="absolute inset-0 bg-black/20 z-10"></div>
            <Image
                src={imageSrc}
                alt={imageAlt}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 33vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-4">
                <h3 className="text-white font-bold">{title}</h3>
                <p className="text-gray-300 text-sm">{subtitle}</p>
            </div>
            {/* Video Thumbnail */}

            {/* Video  */}
            {videoUrl && (
                <video
                    src={videoUrl}
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
            )}
      </div>
    )
}