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
  icons: { icon: { url: "/masters-logo.png", type: "image/png" }, apple: "/masters-logo.png" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geist.variable} h-full`}>
      <body className="min-h-full font-[family-name:var(--font-geist)]" style={{ background: "#f5f2ec", color: "#1a2e1a" }}>
        {children}
      </body>
    </html>
  );
}
