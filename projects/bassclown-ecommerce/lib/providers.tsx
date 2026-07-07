'use client';

import { SessionProvider } from 'next-auth/react';
import { AuthProvider } from '@/lib/auth-context';
import { ReactNode } from 'react';
import { VideoModalProvider } from './video-modal-context';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider 
      basePath="/api/auth"
      refetchInterval={0}
      refetchOnWindowFocus={false}
    >
      <AuthProvider>
        <VideoModalProvider>
          {children}
        </VideoModalProvider>
      </AuthProvider>
    </SessionProvider>
  );
} 