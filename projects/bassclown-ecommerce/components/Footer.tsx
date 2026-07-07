import Link from "next/link";
import Image from "next/image";
import { NAV_ITEMS, SOCIAL_LINKS, COMPANY_ADDRESS, COMPANY_PHONE, COMPANY_EMAIL } from "@/lib/constants";
import { Facebook, Instagram, Linkedin } from "lucide-react";

export const Footer = () => {
  const getSocialIcon = (platform: string) => {
    switch (platform) {
      case 'Facebook':
        return <Facebook className="h-5 w-5" />;
      case 'Instagram':
        return <Instagram className="h-5 w-5" />;
      case 'LinkedIn':
        return <Linkedin className="h-5 w-5" />;
      default:
        return null;
    }
  };

  return (
    <footer className="bg-slate-800 text-white pt-16 relative z-10">
      {/* Media company tagline */}
      <div className="container mx-auto px-4 text-center mb-12">
        <h2 className="text-2xl md:text-3xl font-phosphate title-text uppercase mb-4">A Media Company</h2>
        <div className="flex items-center justify-center">
          <h3 className="text-3xl md:text-4xl lg:text-5xl font-phosphate title-text uppercase">
            With a <span className="text-red-600">"Catch"</span> of Humor!
          </h3>
        </div>
      </div>

      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div>
            <div className="mb-6">
              <Image 
                src="/images/bass-clown-co-logo-wide.png" 
                alt="Bass Clown Co" 
                width={200} 
                height={80} 
                style={{ width: 'auto', height: 'auto', maxWidth: '200px' }}
                className="mb-6" 
              />
              <p className="text-slate-300">
                Professional video production for the fishing industry. We create engaging content that showcases your brand and products with a touch of humor.
              </p>
            </div>
            
            <div className="flex space-x-5 mt-6">
              {SOCIAL_LINKS.map((link) => (
                <a
                  key={link.platform}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={link.label}
                  className="text-white hover:text-red-500 transition-colors duration-300"
                >
                  {getSocialIcon(link.platform)}
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-6">Quick Links</h3>
            <ul className="grid grid-cols-2 gap-2">
              {NAV_ITEMS.slice(0, 10).map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-slate-300 hover:text-red-500 transition-colors text-sm"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-6">Contact Us</h3>
            <p className="text-slate-300 mb-4">{COMPANY_ADDRESS}</p>
            <p className="text-slate-300 mb-4">{COMPANY_PHONE}</p>
            <p className="text-slate-300 mb-4">{COMPANY_EMAIL}</p>
            <Link 
              href="/contact" 
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 inline-block mt-4 transition-colors"
            >
              Get In Touch
            </Link>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-700 mt-10">
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <div className="text-center md:text-left">
              <p className="text-slate-400 text-sm">
                &copy; {new Date().getFullYear()} Bass Clown Co. All rights reserved.
              </p>
            </div>
            <div className="flex justify-center md:justify-end space-x-6 mt-4 md:mt-0">
              <Link href="/privacy" className="text-slate-400 hover:text-red-500 text-sm">Privacy Policy</Link>
              <Link href="/terms" className="text-slate-400 hover:text-red-500 text-sm">Terms of Service</Link>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-700">
        <div className="container mx-auto px-4 py-4">
          <div className="text-center">
            <p className="text-slate-500 text-xs">
              Powered by{" "}
              <a 
                href="https://solheimtech.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-red-500 transition-colors"
              >
                Solheim Technologies
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
