"use client";

import { useRef } from "react";
import { ContactForm } from "@/components/ContactForm";
import { COMPANY_ADDRESS, COMPANY_PHONE, COMPANY_EMAIL } from "@/lib/constants";
import { Mail, Phone, MapPin } from "lucide-react";

export const ContactSection = () => {
  const mapRef = useRef<HTMLDivElement>(null);

  return (
    <section id="contact" className="py-24 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Contact Us</h2>
          <div className="w-24 h-1 bg-red-600 mx-auto mb-6"></div>
          <p className="text-slate-600 max-w-2xl mx-auto">
            Ready to discuss your video project? Get in touch with our team for a free consultation
            and quote. We&apos;re here to bring your video content ideas to life.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
            <h3 className="text-2xl font-semibold mb-6">Send Us a Message</h3>
            <ContactForm />
          </div>

          <div>
            <h3 className="text-2xl font-semibold mb-6">Find Us</h3>
            
            <div className="bg-slate-100 p-6 rounded-lg mb-8">
              <div className="flex items-start mb-4">
                <div className="bg-red-500/10 p-2 rounded-full mr-4 mt-1">
                  <MapPin className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <h4 className="font-medium text-slate-900 mb-1">Address</h4>
                  <p className="text-slate-600">{COMPANY_ADDRESS}</p>
                </div>
              </div>
              
              <div className="flex items-start mb-4">
                <div className="bg-red-500/10 p-2 rounded-full mr-4 mt-1">
                  <Phone className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <h4 className="font-medium text-slate-900 mb-1">Phone</h4>
                  <p className="text-slate-600">{COMPANY_PHONE}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-red-500/10 p-2 rounded-full mr-4 mt-1">
                  <Mail className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <h4 className="font-medium text-slate-900 mb-1">Email</h4>
                  <p className="text-slate-600">{COMPANY_EMAIL}</p>
                </div>
              </div>
            </div>
            
            <div className="h-80 relative rounded-lg overflow-hidden" ref={mapRef}>
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3328.846682123959!2d-112.07462492332595!3d33.44289327499204!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x872b12ed50a179cb%3A0x8c69c7f8354a1bac!2s123%20W%20Main%20St%2C%20Phoenix%2C%20AZ%2085001%2C%20USA!5e0!3m2!1sen!2sus!4v1683037372633!5m2!1sen!2sus"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                aria-label="Map showing Bass Clown Co location"
              ></iframe>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
