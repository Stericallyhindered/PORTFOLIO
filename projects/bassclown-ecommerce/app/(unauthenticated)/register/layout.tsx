import { Metadata } from "next"

export const metadata: Metadata = {
  title: 'Register',
  description: 'Register for Bass Clown Co',
  alternates: {
    canonical: 'https://bassclown.com/register',
  },
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
    </>
  );
}