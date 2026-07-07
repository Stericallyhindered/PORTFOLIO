import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Giveaways',
  description: 'Giveaways for Bass Clown Co',
  alternates: {
    canonical: 'https://bassclown.com/giveaways',
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

export default function GiveawaysLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            {children}
        </>
    );
}