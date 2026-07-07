import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us',
  description: 'About Bass Clown Co',
  alternates: {
    canonical: 'https://bassclown.com/about',
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            {children}
        </>
    );
}