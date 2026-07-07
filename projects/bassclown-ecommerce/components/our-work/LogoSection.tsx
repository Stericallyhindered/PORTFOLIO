"use client";

import Image from "next/image";

export const LogoSection = () => {
  return (
    <section className="bg-black py-16">
      <div className="container mx-auto px-4 flex justify-center">
        <div className="w-full max-w-md">
          <Image
            src="/images/assets/bass-clown-red-cream.png"
            alt="Bass Clown Co Logo"
            width={400}
            height={160}
            className="w-full h-auto"
          />
        </div>
      </div>
    </section>
  );
};
