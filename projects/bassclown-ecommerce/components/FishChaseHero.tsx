import Image from "next/image";
import Fishy from '@/public/images/assets/bass-clown-co-fish-chase.png';
export default function FishChaseHero({ title, description }: { title: string, description: string }) {
    return (
      <section className="relative pt-20 pb-5 overflow-hidden bg-[#3B4046]">
        <div className="absolute inset-0 z-20">
          <Image
            src={Fishy}
            alt="Bass Fish Illustration"
            fill
            className="object-contain md:object-fill opacity-60 saturate-0 contrast-200"
            priority
          />
        </div>
        <div className="container mx-auto py-8 px-4 relative z-20">
          <div className="text-center mb-8">
            <h1 className="title-text text-4xl md:text-6xl lg:text-7xl text-white mb-4">
              {title}
            </h1>
            <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto">
              {description}
            </p>
          </div>
        </div>
        <div className="absolute bottom-20 left-0 -translate-x-1/2 z-10">
            <Image src="/images/assets/bubbles.svg" 
            alt="Bubbles" 
            width={300}
            height={300}
            className="object-fill opacity-40 saturate-0 contrast-200 scale-x-[-1]" />
        </div>
        <div className="absolute bottom-20 right-0 translate-x-3/4 z-0">
            <Image src="/images/assets/bubbles.svg" 
            alt="Bubbles" 
            width={300}
            height={300}
            className="object-fill opacity-40 saturate-0 contrast-200 scale-y-[-1]" />
        </div>
      </section>
    );
}