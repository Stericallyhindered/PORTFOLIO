import type { Metadata } from 'next';
import { CheckCircle, Mail, ArrowLeft } from "lucide-react";
import { COMPANY_EMAIL } from "@/lib/constants";
import HookLine from "@/components/HookLine";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: 'Thank You - Bass Clown Co',
  description: 'Thank you for contacting Bass Clown Co. We have received your message and will get back to you soon.',
};

export default function ThankYou() {
  return (
    <main className="flex flex-col min-h-screen bg-[#1A1A1A] text-cream">
      {/* Top Film Reel Border */}
      <div className="w-full h-[22px] overflow-hidden">
        <Image 
          src="/images/assets/video-reel-1.svg" 
          alt="Film reel border"
          width={2560} 
          height={22}
          className="object-cover w-full h-full"
        />
      </div>

      {/* Hero Section */}
      <section 
        id="thank-you-hero" 
        className="relative min-h-[70vh] flex flex-col items-center justify-center overflow-hidden py-16 md:py-20 px-4 bg-[#3B4046]"
      >
        <HookLine
          size={80}
          color="#ECE9D9"
          className="absolute top-0 left-1/2 -translate-x-1/2 z-[1]"
        />
        {/* Background Fish Illustration */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/assets/bass-clown-co-fish-chase.png"
            alt="Bass Clown Co Illustration"
            fill
            className="object-cover opacity-60 saturate-0 contrast-200"
            priority
          />
        </div>
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-black/30 z-[1]"></div>
        
        <div className="container mx-auto px-4 relative z-10 flex flex-col items-center justify-center text-center">
          {/* Success Icon */}
          <div className="bg-green-600/20 p-6 rounded-full mb-8">
            <CheckCircle className="h-16 w-16 text-green-400" />
          </div>
          
          <h1 className="font-phosphate text-4xl md:text-6xl tracking-wider text-cream uppercase mb-6 text-shadow-lg title-text">
            MESSAGE SENT!
          </h1>
          <p className="text-lg md:text-xl tracking-wide text-cream/90 font-phosphate max-w-3xl title-text mb-8">
            Thank you for reaching out to Bass Clown Co. We&apos;ve received your message and will get back to you within 24-48 hours.
          </p>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mt-6">
            <Link href="/">
              <Button className="bg-red-600 hover:bg-red-700 text-white font-phosphate title-text text-lg px-8 py-3">
                <ArrowLeft className="mr-2 h-5 w-5" />
                Back to Home
              </Button>
            </Link>
            <Link href="/our-work">
              <Button variant="outline" className="border-cream text-[#1A1A1A] bg-cream font-phosphate title-text text-lg px-8 py-3">
                View Our Work
              </Button>
            </Link>
          </div>
        </div>
      </section>
      
      {/* What Happens Next Section */}
      <section className="container mx-auto px-4 py-16 md:py-20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-phosphate title-text text-cream mb-12 text-center">What Happens Next?</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="bg-[#2D2D2D] rounded-lg shadow-xl p-8 text-center">
              <div className="bg-red-600/20 p-4 rounded-full mx-auto mb-6 w-fit">
                <Mail className="h-8 w-8 text-red-400" />
              </div>
              <h3 className="text-xl font-phosphate title-text text-cream mb-4">1. We Review</h3>
              <p className="text-cream/80 leading-relaxed">
                Our team will carefully review your message and project requirements to understand your needs.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-[#2D2D2D] rounded-lg shadow-xl p-8 text-center">
              <div className="bg-red-600/20 p-4 rounded-full mx-auto mb-6 w-fit">
                <div className="h-8 w-8 text-red-400 flex items-center justify-center font-phosphate text-lg">
                  💬
                </div>
              </div>
              <h3 className="text-xl font-phosphate title-text text-cream mb-4">2. We Connect</h3>
              <p className="text-cream/80 leading-relaxed">
                We&apos;ll reach out to you within 24-48 hours to discuss your project and answer any questions.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-[#2D2D2D] rounded-lg shadow-xl p-8 text-center">
              <div className="bg-red-600/20 p-4 rounded-full mx-auto mb-6 w-fit">
                <div className="h-8 w-8 text-red-400 flex items-center justify-center font-phosphate text-lg">
                  🎬
                </div>
              </div>
              <h3 className="text-xl font-phosphate title-text text-cream mb-4">3. We Create</h3>
              <p className="text-cream/80 leading-relaxed">
                Once we align on your vision, we&apos;ll start crafting compelling video content for your brand.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Info Section */}
      <section className="bg-[#2D2D2D] py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-phosphate title-text text-cream mb-6">Need to Reach Us Immediately?</h2>
            <p className="text-cream/80 mb-8">
              For urgent matters, you can reach us directly at:
            </p>
            <div className="bg-[#1A1A1A] rounded-lg p-6">
              <div className="flex items-center justify-center">
                <Mail className="h-5 w-5 text-red-400 mr-3" />
                <a 
                  href={`mailto:${COMPANY_EMAIL}`} 
                  className="text-cream hover:text-red-400 transition-colors font-phosphate title-text text-lg"
                >
                  {COMPANY_EMAIL}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
} 