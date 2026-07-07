'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

export const ConditionalLayout: React.FC<ConditionalLayoutProps> = ({ children }) => {
  const pathname = usePathname();
  
  // Check if we're on an authenticated route
  const isAuthenticatedRoute = pathname.startsWith('/dashboard') || 
                               pathname.startsWith('/admin') ||
                               pathname.startsWith('/contests') ||
                               pathname.startsWith('/my-contests') ||
                               pathname.startsWith('/my-entries') ||
                               pathname.startsWith('/brand');

  // Known public routes that should have header/footer
  const knownPublicRoutes = [
    '/',
    '/our-work',
    '/services',
    '/about',
    '/contact',
    '/blog',
    '/store',
    '/content-contests',
    '/giveaways',
    '/how-it-works',
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/verify-email',
    '/privacy',
    '/terms',
  ];

  // Check if this is a known public route
  const isKnownPublicRoute = knownPublicRoutes.some(route => {
    if (route === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(route);
  });

  if (isAuthenticatedRoute) {
    // For authenticated routes, render children without header/footer and with proper background
    return (
      <div className="min-h-screen bg-[#1A1A1A]">
        {children}
      </div>
    );
  }

  // For unknown routes (likely 404), render without header/footer wrapper
  // The not-found.tsx component handles its own layout
  if (!isKnownPublicRoute && pathname !== '/') {
    return <>{children}</>;
  }

  // For unauthenticated routes, render with header and footer
  return (
    <div className="overflow-x-hidden">
      
      <Header />
      {/* Movie Reel Overlay */}
      <div className="fixed top-[69px] left-0 right-0 w-screen pointer-events-none z-40">
        <Image
          src="/images/assets/video-reel-bottom-half-new.svg"
          alt=""
          width={1920}
          height={60}
          className="w-full h-auto opacity-90"
          aria-hidden="true"
          priority
        />
      </div>
      <div className="pt-24 relative z-10 bg-black">
        {children}
      </div>
      <Footer />
    </div>
  );
}; 