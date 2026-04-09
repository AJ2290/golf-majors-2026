import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Golf Majors Sweepstake 2026",
  description: "Pick your golfers, track the scores, win the pot",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geist.variable} h-full`}>
      <body className="min-h-full text-white font-[family-name:var(--font-geist)]" style={{ background: "#09170e" }}>
        {children}
      </body>
    </html>
  );
}
