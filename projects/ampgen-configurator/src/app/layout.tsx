import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AmpGen Boat Configurator | Stealth Lithium Batteries",
  description: "Configure your boat electronics and calculate battery requirements with the AmpGen configurator.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
