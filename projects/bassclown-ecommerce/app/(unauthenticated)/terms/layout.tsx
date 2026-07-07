import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms of Service for Bass Clown Co',
  alternates: {
    canonical: 'https://bassclown.com/terms',
  },
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
    </>
  );
}