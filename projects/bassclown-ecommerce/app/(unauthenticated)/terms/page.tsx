"use client";

import Link from 'next/link';
import HookLine from '@/components/HookLine';
import Bubbles from '@/components/Bubbles';
import Image from 'next/image';
import { useEffect, useRef } from 'react';

export default function TermsOfService() {
  const sectionRef = useRef<HTMLElement>(null);

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

    const elements = document.querySelectorAll(".fade-in");
    elements.forEach((element) => observer.observe(element));

    return () => {
      elements.forEach((element) => observer.unobserve(element));
    };
  }, []);

  return (
    <main className="min-h-screen flex flex-col relative bg-slate-900 text-cream overflow-hidden">
      {/* Hero Section */}
      <section 
        id="terms-hero" 
        className="relative flex flex-col items-center justify-center py-24 px-4"
        style={{ backgroundColor: '#455467' }}
        ref={sectionRef}
      >
        <HookLine
          size={100}
          color="#ECE9D9"
          className="absolute top-0 left-1/2 -translate-x-1/2 z-[1]"
        />
        
        {/* Floating Bubbles */}
        <Bubbles 
          className="absolute top-10 right-10 opacity-30 transform rotate-12" 
          width={300} 
          height={300} 
        />
        <Bubbles 
          className="absolute bottom-10 left-10 opacity-20 transform -rotate-12 scale-75" 
          width={250} 
          height={250} 
        />

        {/* Title with fishing theme */}
        <div className="text-center z-20 relative fade-in opacity-0 translate-y-8">
          <h1 className="title-text text-4xl md:text-6xl tracking-widest text-cream mb-6 text-shadow-sm">
            TERMS OF SERVICE
          </h1>
          <p className="text-lg md:text-xl text-cream/90 mb-8 max-w-2xl mx-auto">
            The Rules of the Water - No Surprises, Just Clear Guidelines
          </p>
          <div className="flex items-center justify-center gap-4 text-cream/70">
            <div className="w-8 h-0.5 bg-cream/50"></div>
            <span className="text-sm">🎣 FAIR & TRANSPARENT TERMS 🎣</span>
            <div className="w-8 h-0.5 bg-cream/50"></div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="relative bg-[#1A1A1A] py-16">
        {/* Video reel divider */}
        <div className="absolute -top-5 left-0 w-full z-10">
          <Image 
            src="/images/assets/video-reel-1.svg" 
            alt="Film Reel" 
            width={2560}
            height={44}
            className="w-full object-cover" 
          />
        </div>

        <div className="container mx-auto px-4 max-w-4xl relative z-20">
          {/* Introduction */}
          <div className="fade-in opacity-0 translate-y-8 mb-12">
            <div className="bg-[#333132] rounded-lg p-8 border-l-4 border-primary">
              <h2 className="title-text text-2xl md:text-3xl text-cream mb-4">
                WELCOME TO OUR WATERS
              </h2>
              <p className="text-cream/90 text-lg leading-relaxed">
                At Bass Clown Co, we believe in keeping things as clear as a pristine fishing lake. 
                These Terms of Service outline the rules for using our website and services. 
                By casting your line into our waters, you agree to abide by these terms. Let's keep it simple and fair!
              </p>
            </div>
          </div>

          {/* Content Sections */}
          <div className="space-y-12">
            {/* Acceptance of Terms */}
            <div className="fade-in opacity-0 translate-y-8">
              <div className="bg-polaroid p-6 shadow-xl transform rotate-1 hover:rotate-0 transition-transform duration-300">
                <h3 className="text-2xl font-bold text-slate-800 mb-4 font-phosphate">
                  🎯 CASTING YOUR LINE
                </h3>
                <div className="text-slate-700 space-y-4">
                  <p className="font-medium">By using our website or services, you're agreeing to:</p>
                  <ul className="space-y-2 ml-6">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span><strong>Follow the Rules:</strong> Abide by all terms and conditions outlined here</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span><strong>Stay Current:</strong> Check back for updates as terms may change</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span><strong>Be Respectful:</strong> Use our services responsibly and legally</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span><strong>Ask Questions:</strong> Contact us if anything isn't crystal clear</span>
                    </li>
                  </ul>
                </div>
                {/* Tape effect */}
                <div className="absolute -top-3 right-1/4 bg-gradient-to-r from-gray-100/30 to-gray-100/70 w-16 h-8 rotate-12"></div>
              </div>
            </div>

            {/* Use License */}
            <div className="fade-in opacity-0 translate-y-8">
              <div className="bg-polaroid p-6 shadow-xl transform -rotate-1 hover:rotate-0 transition-transform duration-300">
                <h3 className="text-2xl font-bold text-slate-800 mb-4 font-phosphate">
                  📜 YOUR FISHING LICENSE
                </h3>
                <div className="text-slate-700 space-y-4">
                  <p className="font-medium">We grant you permission to use our website for legitimate purposes. You may not:</p>
                  <ul className="space-y-2 ml-6">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span><strong>Copy Our Content:</strong> Reproduce, distribute, or modify our materials without permission</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span><strong>Commercial Use:</strong> Use our content for commercial purposes without our consent</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span><strong>Reverse Engineer:</strong> Attempt to decode or reverse engineer our software</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span><strong>Remove Credits:</strong> Strip away copyright or proprietary notices</span>
                    </li>
                  </ul>
                </div>
                <div className="absolute -top-3 left-1/3 bg-gradient-to-r from-gray-100/30 to-gray-100/70 w-16 h-8 -rotate-12"></div>
              </div>
            </div>

            {/* Services & Content */}
            <div className="fade-in opacity-0 translate-y-8">
              <div className="bg-polaroid p-6 shadow-xl transform rotate-1 hover:rotate-0 transition-transform duration-300">
                <h3 className="text-2xl font-bold text-slate-800 mb-4 font-phosphate">
                  🎬 OUR CREATIVE CATCH
                </h3>
                <div className="text-slate-700 space-y-4">
                  <p className="font-medium">When you work with Bass Clown Co:</p>
                  <ul className="space-y-2 ml-6">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span><strong>Quality Guarantee:</strong> We deliver professional, high-quality video content</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span><strong>Timeline Commitment:</strong> We stick to agreed-upon deadlines and milestones</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span><strong>Content Ownership:</strong> You own the final deliverables as specified in your agreement</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span><strong>Revision Process:</strong> We include reasonable revisions as outlined in your project scope</span>
                    </li>
                  </ul>
                </div>
                <div className="absolute -top-3 right-1/4 bg-gradient-to-r from-gray-100/30 to-gray-100/70 w-16 h-8 rotate-12"></div>
              </div>
            </div>

            {/* User Responsibilities */}
            <div className="fade-in opacity-0 translate-y-8">
              <div className="bg-polaroid p-6 shadow-xl transform -rotate-1 hover:rotate-0 transition-transform duration-300">
                <h3 className="text-2xl font-bold text-slate-800 mb-4 font-phosphate">
                  ⚖️ ANGLER'S CODE
                </h3>
                <div className="text-slate-700 space-y-4">
                  <p className="font-medium">As our valued client, we ask that you:</p>
                  <ul className="space-y-2 ml-6">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span><strong>Provide Accurate Info:</strong> Give us correct and complete project information</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span><strong>Respect Deadlines:</strong> Provide feedback and materials within agreed timeframes</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span><strong>Honor Agreements:</strong> Pay invoices on time and follow contract terms</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span><strong>Communicate Clearly:</strong> Keep us informed of any changes or concerns</span>
                    </li>
                  </ul>
                </div>
                <div className="absolute -top-3 left-1/3 bg-gradient-to-r from-gray-100/30 to-gray-100/70 w-16 h-8 -rotate-12"></div>
              </div>
            </div>

            {/* Disclaimers */}
            <div className="fade-in opacity-0 translate-y-8">
              <div className="bg-polaroid p-6 shadow-xl transform rotate-1 hover:rotate-0 transition-transform duration-300">
                <h3 className="text-2xl font-bold text-slate-800 mb-4 font-phosphate">
                  ⚠️ FAIR WARNING
                </h3>
                <div className="text-slate-700 space-y-4">
                  <p className="font-medium">Like any good fishing guide, we need to set expectations:</p>
                  <ul className="space-y-2 ml-6">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span><strong>No Guarantees:</strong> Results may vary based on project scope and market factors</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span><strong>Technical Limitations:</strong> Technology has its limits, and we'll work within them</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span><strong>Third-Party Services:</strong> We're not responsible for external platforms or services</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span><strong>Force Majeure:</strong> Sometimes nature (or technology) has other plans</span>
                    </li>
                  </ul>
                </div>
                <div className="absolute -top-3 right-1/4 bg-gradient-to-r from-gray-100/30 to-gray-100/70 w-16 h-8 rotate-12"></div>
              </div>
            </div>

            {/* Changes to Terms */}
            <div className="fade-in opacity-0 translate-y-8">
              <div className="bg-polaroid p-6 shadow-xl transform -rotate-1 hover:rotate-0 transition-transform duration-300">
                <h3 className="text-2xl font-bold text-slate-800 mb-4 font-phosphate">
                  🔄 CHANGING TIDES
                </h3>
                <div className="text-slate-700 space-y-4">
                  <p className="font-medium">Like the seasons, our terms may evolve:</p>
                  <ul className="space-y-2 ml-6">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span><strong>Notice of Changes:</strong> We'll notify you of any significant updates</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span><strong>Effective Date:</strong> Changes take effect when posted unless otherwise noted</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span><strong>Your Choice:</strong> Continued use means you accept the updated terms</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span><strong>Questions Welcome:</strong> Ask us about any changes you don't understand</span>
                    </li>
                  </ul>
                </div>
                <div className="absolute -top-3 left-1/3 bg-gradient-to-r from-gray-100/30 to-gray-100/70 w-16 h-8 -rotate-12"></div>
              </div>
            </div>

            {/* Contact Section */}
            <div className="fade-in opacity-0 translate-y-8">
              <div className="bg-[#333132] rounded-lg p-8 border-2 border-primary/30 text-center">
                <h2 className="title-text text-2xl md:text-3xl text-cream mb-4">
                  QUESTIONS ABOUT THE RULES?
                </h2>
                <p className="text-cream/90 mb-6 text-lg">
                  Don't let legal jargon muddy the waters! If you have any questions about these Terms of Service, 
                  we're here to clear things up. Our team is always ready to help you navigate.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <a 
                    href="tel:+14805551234" 
                    className="bg-primary text-white px-6 py-3 rounded-lg font-bold hover:bg-primary/90 transition-colors flex items-center gap-2"
                  >
                    📞 (480) 555-1234
                  </a>
                  <a 
                    href="mailto:info@bassclown.com" 
                    className="bg-secondary text-cream px-6 py-3 rounded-lg font-bold hover:bg-secondary/90 transition-colors flex items-center gap-2"
                  >
                    ✉️ info@bassclown.com
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <section className="bg-slate-900 py-12 border-t border-cream/20">
        <div className="container mx-auto px-4 text-center">
          <div className="fade-in opacity-0 translate-y-8">
            <p className="text-cream/70 text-sm mb-4">
              Last updated: July 17, 2025
            </p>
            <div className="flex justify-center items-center gap-6 text-cream/60">
              <Link 
                href="/" 
                className="hover:text-primary transition-colors flex items-center gap-2"
              >
                🏠 Return to Home
              </Link>
              <span className="text-cream/30">|</span>
              <Link 
                href="/privacy" 
                className="hover:text-primary transition-colors flex items-center gap-2"
              >
                🔒 Privacy Policy
              </Link>
              <span className="text-cream/30">|</span>
              <Link 
                href="/contact" 
                className="hover:text-primary transition-colors flex items-center gap-2"
              >
                📧 Contact Us
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
