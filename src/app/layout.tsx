import type { Metadata } from "next";
import { Press_Start_2P, VT323 } from "next/font/google";
import "./globals.css";

const pixelFont = VT323({
  weight: "400",
  display: "swap",
  preload: true,
  variable: "--font-pixel",
  subsets: ["latin"],
});

const pixelDisplayFont = Press_Start_2P({
  weight: "400",
  display: "swap",
  preload: true,
  variable: "--font-pixel-display",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Home Theater RPG",
  description: "Retro pixel RPG sales tracker for Home Theater.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${pixelFont.variable} ${pixelDisplayFont.variable} h-full`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
