"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { MobileMenu } from "@/components/MobileMenu";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth-context";
import { User, LogIn, ChevronDown } from "lucide-react";

export const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const pathname = usePathname();

  // Check if a navigation item is active
  const isActiveLink = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  // Check if any sub-item in a dropdown is active
  const isDropdownActive = (subItems?: { href: string; label: string }[]) => {
    if (!subItems) return false;
    return subItems.some(subItem => isActiveLink(subItem.href));
  };

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsScrolled(scrollPosition > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "relative fixed top-0 left-0 w-full z-50 transition-all duration-300 w-screen flex justify-center",
        isScrolled
          ? "bg-[#1D1D20]/90 py-4"
          : "bg-[#1D1D20]/90 py-4"
      )}
    >
      <div className="container w-screen px-4 flex items-center justify-between">
        <Link href="/" className="flex items-center z-10">
          <Image 
            src="/images/bass-clown-co-logo-wide.png" 
            alt="Bass Clown Co" 
            width={170} 
            height={50} 
            style={{ width: 'auto', height: 'auto', maxWidth: '170px' }}
            priority
          />
        </Link>

        <nav className="hidden lg:flex items-center space-x-6">
          {NAV_ITEMS.map((item) => (
            <div key={item.href} className="flex items-center">
              {item.subItems ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className={cn(
                      "text-xs font-medium transition-colors flex items-center space-x-1 h-6",
                      isDropdownActive(item.subItems) 
                        ? "text-red-500" 
                        : "text-white hover:text-red-500"
                    )}>
                      <span>{item.label}</span>
                      <ChevronDown size={14} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="center"
                    className="bg-[#1D1D1F] border-gray-600 min-w-56"
                  >
                    {item.subItems.map((subItem) => (
                      <DropdownMenuItem key={subItem.href} asChild>
                        <Link
                          href={subItem.href}
                          className={cn(
                            "transition-colors cursor-pointer",
                            isActiveLink(subItem.href)
                              ? "text-red-500"
                              : "text-white hover:text-red-500"
                          )}
                        >
                          {subItem.label}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link
                  href={item.href}
                  className={cn(
                    "text-xs font-medium transition-colors h-6 flex items-center",
                    isActiveLink(item.href)
                      ? "text-red-500"
                      : "text-white hover:text-red-500"
                  )}
                >
                  {item.label}
                </Link>
              )}
            </div>
          ))}
        </nav>

        <div className="flex items-center space-x-4">
          {/* Auth button for desktop */}
          {isAuthenticated && (
            <div className="hidden lg:flex items-center space-x-2">
              <span className="text-xs text-gray-300">Welcome, {user?.name}</span>
              <Link href="/dashboard">
                <Button variant="outline" size="sm" className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white">
                  Dashboard
                </Button>
              </Link>
            </div>
          )}

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden z-50 text-white focus:outline-none hover:text-gray-300 transition-colors"
            aria-label="Toggle mobile menu"
          >
            <div className="flex flex-col space-y-1.5 w-6">
              <span
                className={cn(
                  "block h-0.5 bg-white transition-all duration-300",
                  isMobileMenuOpen ? "rotate-45 translate-y-2" : ""
                )}
              ></span>
              <span
                className={cn(
                  "block h-0.5 bg-white transition-all duration-300",
                  isMobileMenuOpen ? "opacity-0" : "opacity-100"
                )}
              ></span>
              <span
                className={cn(
                  "block h-0.5 bg-white transition-all duration-300",
                  isMobileMenuOpen ? "-rotate-45 -translate-y-2" : ""
                )}
              ></span>
            </div>
          </button>
        </div>

        <MobileMenu 
          isOpen={isMobileMenuOpen} 
          onClose={() => setIsMobileMenuOpen(false)} 
          isAuthenticated={isAuthenticated}
          user={user}
        />
      </div>
      
      {/* Movie reel moved to layout component for better positioning */}
    </header>
  );
};
