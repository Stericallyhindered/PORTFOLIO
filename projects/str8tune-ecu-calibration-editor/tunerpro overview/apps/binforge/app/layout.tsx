import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BINFORGE",
  description: "Modern BIN editing studio for tuners managing vehicles, projects, and XDF-driven tables.",
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
