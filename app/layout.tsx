import type { Metadata } from "next";
import {
  Geist_Mono,
  Manrope,
} from "next/font/google";

import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "GoodKeeper",
    template: "%s | GoodKeeper",
  },
  description:
    "AI-powered booking, customer management, bookkeeping, and reporting for service businesses.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${manrope.variable} ${geistMono.variable}`}
    >
      <body className="bg-black font-sans text-white antialiased">
        {children}
      </body>
    </html>
  );
}