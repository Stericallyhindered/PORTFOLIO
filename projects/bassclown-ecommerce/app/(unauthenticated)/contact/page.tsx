import type { Metadata } from 'next';
import { ContactForm } from "@/components/ContactForm";
import { Mail } from "lucide-react";
import { COMPANY_EMAIL } from "@/lib/constants";
import { CTASection } from '@/components/home/CTASection';
import HookLine from "@/components/HookLine";
import Image from "next/image";
import FishChaseHero from '@/components/FishChaseHero';

export const metadata: Metadata = {
  title: 'Contact Us - Bass Clown Co',
  description: 'Get in touch with Bass Clown Co for professional fishing video production services. Contact us to discuss your project needs.',
};

export default function Contact() {
  return (
    <main className="flex flex-col min-h-screen bg-[#1A1A1A] text-cream">


      {/* Hero Section */}
      <FishChaseHero title="GET IN TOUCH" description="Have a question or ready to start your project? We're here to help create compelling video content for your fishing brand." />

      
      <section className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12">
          {/* Contact Info */}
          <div className="lg:col-span-1">
            <div className="bg-[#2D2D2D] rounded-lg shadow-xl overflow-hidden">
              <div className="bg-slate-800/50 p-6">
                <h2 className="text-2xl md:text-3xl font-phosphate title-text text-cream mb-2">Contact Details</h2>
                <p className="text-cream/80">
                  We&apos;d love to hear from you. Send us a message and we&apos;ll get back to you as soon as possible.
                </p>
              </div>
              
              <div className="p-6">
                <div className="flex items-start">
                  <div className="bg-red-600/20 p-3 rounded-full mr-4 shrink-0">
                    <Mail className="h-5 w-5 text-red-400" />
                  </div>
                  <div>
                    <h3 className="font-phosphate title-text text-lg text-cream mb-1">Email</h3>
                    <a href={`mailto:${COMPANY_EMAIL}`} className="text-cream/80 hover:text-red-400 transition-colors">
                      {COMPANY_EMAIL}
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Response Time Info */}
            <div className="mt-6 bg-[#2D2D2D] rounded-lg shadow-xl p-6">
              <h3 className="text-xl font-phosphate title-text text-cream mb-3">Response Time</h3>
              <p className="text-cream/80 text-sm leading-relaxed">
                We typically respond to all inquiries within 24-48 hours during business days. 
                For urgent matters, please mention it in your message.
              </p>
            </div>
          </div>
          
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-[#2D2D2D] rounded-lg shadow-xl p-6 md:p-8">
              <h2 className="text-2xl md:text-3xl font-phosphate title-text text-cream mb-6">Send Us a Message</h2>
              <ContactForm />
            </div>
          </div>
        </div>
        
        {/* FAQs */}
        <div className="mt-16 md:mt-24">
          <h2 className="text-3xl md:text-4xl font-phosphate title-text text-cream mb-10 md:mb-12 text-center">Frequently Asked Questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              { q: "How soon can you start on my project?", a: "Our typical lead time is 2-3 weeks, though this can vary depending on the project scope and our current workload. We're happy to discuss your timeline needs during our initial consultation." },
              { q: "Do you travel for video shoots?", a: "Yes! We regularly travel throughout the country to capture fishing content in various locations. Travel expenses are quoted separately based on location and duration." },
              { q: "What's your pricing structure?", a: "Each project is quoted individually based on scope, duration, equipment needs, and deliverables. We create custom packages designed to fit various budgets and objectives." },
              { q: "How do you handle product reviews?", a: "Our product reviews are honest and transparent. We'll highlight your product's strengths while providing constructive feedback. We discuss our approach in detail before beginning any review campaign." }
            ].map((faq, index) => (
              <div key={index} className="bg-[#2D2D2D] p-6 rounded-lg shadow-xl">
                <h3 className="text-xl md:text-2xl font-phosphate title-text text-cream mb-3">{faq.q}</h3>
                <p className="text-cream/80 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <CTASection />
    </main>
  );
}
