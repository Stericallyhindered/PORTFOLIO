import Image from 'next/image';
import BassFishy from '@/components/BassFishy';
import Bubbles from '@/components/Bubbles';
import WaitlistForm from '@/components/WaitlistForm';
import { Star } from 'lucide-react';

export default function ComingSoonOverlay({ title, description, cta }: { title: string, description: string, cta: React.ReactNode }) {
    return (
        <div className="relative inset-0 bg-black/95 backdrop-blur-md z-40 flex flex-col">
        {/* Top Film Reel Border */}
        <div className="w-full h-[22px] shrink-0">

        </div>
        
        <div className="flex-1 relative overflow-hidden flex items-center justify-center">
          {/* Subtle Background Elements */}
          <div className="absolute inset-0 opacity-5 pointer-events-none">
            <BassFishy className="absolute top-1/4 left-1/4 transform scale-150 opacity-20" />
            <Bubbles className="absolute bottom-0 right-0 w-1/2 h-1/2 opacity-10" />
          </div>
          
          {/* Main Content */}
          <div className="text-center px-4 max-w-4xl mx-auto relative z-10 py-8">
            
            {/* Animated Film Reel Icon */}
            <div className="mb-6 relative inline-block">
              <div className="w-32 h-32 mx-auto relative animate-spin-slow drop-shadow-xl">
                <Image
                  src="/images/assets/film-reel-icon.svg"
                  alt="Film reel"
                  fill
                  className="object-contain opacity-90"
                />
              </div>
            </div>
            
            <h1 className="font-phosphate text-6xl md:text-8xl tracking-widest text-cream uppercase mb-6 text-shadow-xl title-text animate-fade-in">
              Coming Soon
            </h1>
            
            <div className="flex items-center justify-center mb-8 gap-4">
              <Star className="w-8 h-8 text-red-500 animate-twinkle" />
              <h2 className="font-phosphate text-2xl md:text-4xl text-cream/90 tracking-wide title-text uppercase">
                {title}
              </h2>
              <Star className="w-8 h-8 text-red-500 animate-twinkle delay-200" />
            </div>
            
            <p className="text-xl md:text-2xl text-cream/80 mb-10 leading-relaxed max-w-2xl mx-auto animate-fade-in-delay">
              {description}
            </p>
            
            {/* CTA Button */}
              {cta}
          </div>
        </div>
        
        {/* Bottom Film Reel Border */}
        <div className="w-full h-[22px] overflow-hidden shrink-0 rotate-180">
        </div>
      </div>

    )
}