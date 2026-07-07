"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";

// Services list based on the specified description
const SERVICES_LIST = [
  "Commercials",
  "Brand Development Videos",
  "Infomercials",
  "Product launch Videos",
  "Product Review Videos",
  "Promotional Videos",
  "Video Contest Promotions",
  "and much much more..."
];

export const ServicesSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

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

    const listItems = document.querySelectorAll(".service-item");
    listItems.forEach((item) => observer.observe(item));

    if (listRef.current) {
      observer.observe(listRef.current);
    }

    return () => {
      listItems.forEach((item) => observer.unobserve(item));
      if (listRef.current) {
        observer.unobserve(listRef.current);
      }
    };
  }, []);

  return (
    <section id="what-we-offer" className="pt-12 md:pt-24 pb-24 md:pb-36 bg-[#333132]" ref={sectionRef}>
      <div className="container mx-auto px-4">
        <div className="flex justify-center mb-6 md:mb-8">
          <Image 
            src="/images/bass-clown-co-logo-wide.png" 
            alt="Bass Clown Co Logo" 
            width={250} 
            height={83}
            className="md:w-[300px] md:h-[100px] mb-2"
          />
        </div>

        <div className="text-center mb-8 md:mb-12">
          <h2 className="text-xl sm:text-2xl md:text-5xl font-bold mb-2 text-primary bass-clown-cursive-regular">
            Other <span className="text-white">Services</span> We Offer We Know You will Love!
          </h2>
        </div>

        <div className="max-w-md mx-auto">
          <ul 
            ref={listRef} 
            className="space-y-2 md:space-y-3 opacity-0 transform translate-y-8 transition-all duration-700 "
          >
            {SERVICES_LIST.map((service, index) => (
              <li 
                key={index} 
                className={`service-item text-center text-white text-base md:text-lg opacity-0 transform translate-y-4 transition-all duration-500 text-phosphate font-bold`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                {service}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <style jsx>{`
        .service-item.show {
          opacity: 1;
          transform: translateY(0);
        }
        
        ul.show {
          opacity: 1;
          transform: translateY(0);
        }
      `}</style>
    </section>
  );
};
