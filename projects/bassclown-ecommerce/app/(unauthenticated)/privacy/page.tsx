"use client";

import Link from 'next/link';
import HookLine from '@/components/HookLine';
import Bubbles from '@/components/Bubbles';
import Image from 'next/image';
import { useEffect, useRef } from 'react';

export default function PrivacyPolicy() {
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
        id="privacy-hero" 
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
            PRIVACY POLICY
          </h1>
          <p className="text-lg md:text-xl text-cream/90 mb-8 max-w-2xl mx-auto">
            How We Handle Your Data Without Being Fishy About It
          </p>
          <div className="flex items-center justify-center gap-4 text-cream/70">
            <div className="w-8 h-0.5 bg-cream/50"></div>
            <span className="text-sm">🎣 KEEPING YOUR INFO SECURE 🎣</span>
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
                STRAIGHT FROM THE TACKLE BOX
              </h2>
              <p className="text-cream/90 text-lg leading-relaxed">
                At Bass Clown Co, we're as serious about protecting your privacy as we are about landing that perfect catch. 
                This policy explains how we collect, use, and protect your information when you visit our website or use our services. 
                No hidden hooks, just straight talk.
              </p>
            </div>
          </div>

          {/* Content Sections */}
          <div className="space-y-12">
            {/* Information We Collect */}
            <div className="fade-in opacity-0 translate-y-8">
              <div className="bg-polaroid p-6 shadow-xl transform rotate-1 hover:rotate-0 transition-transform duration-300">
                <h3 className="text-2xl font-bold text-slate-800 mb-4 font-phosphate">
                  🎯 WHAT'S IN OUR NET
                </h3>
                <div className="text-slate-700 space-y-4">
                  <p className="font-medium">We collect information to provide you with better service, including:</p>
                  <ul className="space-y-2 ml-6">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span><strong>Contact Information:</strong> Name, email address, and phone number when you reach out to us</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span><strong>Project Details:</strong> Information about your video production needs and specifications</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span><strong>Files & Media:</strong> Any content you upload for projects (videos, images, documents)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span><strong>Usage Data:</strong> How you interact with our website and services</span>
                    </li>
                  </ul>
                </div>
                {/* Tape effect */}
                <div className="absolute -top-3 right-1/4 bg-gradient-to-r from-gray-100/30 to-gray-100/70 w-16 h-8 rotate-12"></div>
              </div>
            </div>

            {/* How We Use Information */}
            <div className="fade-in opacity-0 translate-y-8">
              <div className="bg-polaroid p-6 shadow-xl transform -rotate-1 hover:rotate-0 transition-transform duration-300">
                <h3 className="text-2xl font-bold text-slate-800 mb-4 font-phosphate">
                  🎬 HOW WE REEL IT IN
                </h3>
                <div className="text-slate-700 space-y-4">
                  <p className="font-medium">Your information helps us provide top-notch service:</p>
                  <ul className="space-y-2 ml-6">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span><strong>Project Management:</strong> Creating quotes, managing timelines, and delivering your content</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span><strong>Communication:</strong> Keeping you updated on project progress and important announcements</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span><strong>Service Improvement:</strong> Enhancing our website and services based on your feedback</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span><strong>Legal Compliance:</strong> Meeting our business and legal obligations</span>
                    </li>
                  </ul>
                </div>
                <div className="absolute -top-3 left-1/3 bg-gradient-to-r from-gray-100/30 to-gray-100/70 w-16 h-8 -rotate-12"></div>
              </div>
            </div>

            {/* Information Sharing */}
            <div className="fade-in opacity-0 translate-y-8">
              <div className="bg-polaroid p-6 shadow-xl transform rotate-1 hover:rotate-0 transition-transform duration-300">
                <h3 className="text-2xl font-bold text-slate-800 mb-4 font-phosphate">
                  🤝 SHARING THE CATCH
                </h3>
                <div className="text-slate-700 space-y-4">
                  <p className="font-medium">We don't sell your data. We only share information when:</p>
                  <ul className="space-y-2 ml-6">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span><strong>You Give Permission:</strong> When you explicitly consent to sharing</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span><strong>Service Providers:</strong> With trusted partners who help us deliver services (cloud storage, payment processing)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span><strong>Legal Requirements:</strong> When required by law or to protect our rights</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span><strong>Business Transfers:</strong> In the event of a merger or acquisition</span>
                    </li>
                  </ul>
                </div>
                <div className="absolute -top-3 right-1/4 bg-gradient-to-r from-gray-100/30 to-gray-100/70 w-16 h-8 rotate-12"></div>
              </div>
            </div>

            {/* Data Security */}
            <div className="fade-in opacity-0 translate-y-8">
              <div className="bg-polaroid p-6 shadow-xl transform -rotate-1 hover:rotate-0 transition-transform duration-300">
                <h3 className="text-2xl font-bold text-slate-800 mb-4 font-phosphate">
                  🔒 KEEPING IT SECURE
                </h3>
                <div className="text-slate-700 space-y-4">
                  <p className="font-medium">We protect your information like it's our prized fishing spot:</p>
                  <ul className="space-y-2 ml-6">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span><strong>Encryption:</strong> Your data is encrypted in transit and at rest</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span><strong>Access Controls:</strong> Only authorized team members can access your information</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span><strong>Regular Updates:</strong> We keep our security measures current and effective</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span><strong>Secure Storage:</strong> Data is stored with reputable, secure cloud providers</span>
                    </li>
                  </ul>
                </div>
                <div className="absolute -top-3 left-1/3 bg-gradient-to-r from-gray-100/30 to-gray-100/70 w-16 h-8 -rotate-12"></div>
              </div>
            </div>

            {/* Your Rights */}
            <div className="fade-in opacity-0 translate-y-8">
              <div className="bg-polaroid p-6 shadow-xl transform rotate-1 hover:rotate-0 transition-transform duration-300">
                <h3 className="text-2xl font-bold text-slate-800 mb-4 font-phosphate">
                  ⚖️ YOUR RIGHTS
                </h3>
                <div className="text-slate-700 space-y-4">
                  <p className="font-medium">You're in control of your data:</p>
                  <ul className="space-y-2 ml-6">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span><strong>Access:</strong> Request a copy of the information we have about you</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span><strong>Correction:</strong> Ask us to update or correct inaccurate information</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span><strong>Deletion:</strong> Request removal of your personal information</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span><strong>Portability:</strong> Get your data in a portable format</span>
                    </li>
                  </ul>
                </div>
                <div className="absolute -top-3 right-1/4 bg-gradient-to-r from-gray-100/30 to-gray-100/70 w-16 h-8 rotate-12"></div>
              </div>
            </div>

            {/* Contact Section */}
            <div className="fade-in opacity-0 translate-y-8">
              <div className="bg-[#333132] rounded-lg p-8 border-2 border-primary/30 text-center">
                <h2 className="title-text text-2xl md:text-3xl text-cream mb-4">
                  GOT QUESTIONS? WE'RE HERE TO HELP!
                </h2>
                <p className="text-cream/90 mb-6 text-lg">
                  If you have any questions about this Privacy Policy or want to exercise your rights, 
                  don't hesitate to reach out. We're as responsive as a bass hitting a topwater lure at dawn.
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
                href="/terms" 
                className="hover:text-primary transition-colors flex items-center gap-2"
              >
                📋 Terms of Service
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
