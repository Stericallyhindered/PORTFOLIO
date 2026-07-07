import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Content Contests',
  description: 'Content Contests for Bass Clown Co',
  alternates: {
    canonical: 'https://bassclown.com/content-contests',
  },
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function ContentContestsLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            {children}
        </>
    );
}