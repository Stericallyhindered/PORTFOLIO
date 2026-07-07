"use client";

import Image from "next/image";

export const HeroSection = () => {
  return (
    <section className="relative bg-black min-h-[40vh] md:min-h-[80vh] md:py-32 overflow-hidden flex items-center justify-center">
      {/* Background video */}
      <div className="absolute inset-0 z-0 aspect-square md:aspect-video">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute top-1/2 left-1/2 w-full h-full -translate-x-1/2 -translate-y-1/2 object-contain pointer-events-none"
          style={{
            minWidth: '100%',
            minHeight: '100%',
          }}
        >
          <source src="https://blo3rw5wwgi5exel.public.blob.vercel-storage.com/videos/f8-lifted-tournement.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>
    </section>
  );
};
