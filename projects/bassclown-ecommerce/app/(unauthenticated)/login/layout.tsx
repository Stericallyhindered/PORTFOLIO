import { Metadata } from "next"

export const metadata: Metadata = {
  title: 'Login',
  description: 'Login to Bass Clown Co',
  alternates: {
    canonical: 'https://bassclown.com/login',
  },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
    </>
  );
}