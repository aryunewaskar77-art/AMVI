import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Image from "next/image";
import "./globals.css";
import { ClientLayout } from "@/components/layout/ClientLayout";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AMVI | Curated Indian Contemporary & Traditional Fine Art",
  description:
    "An exclusive fine art e-commerce gallery featuring authenticated original 1-of-1 Indian contemporary, Madhubani, Thanjavur, and modernist paintings.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="relative min-h-full flex flex-col bg-[#fbf9f5] text-zinc-900 selection:bg-amber-900 selection:text-white">
        {/* Subtle Ambient AMVI Logo Watermark across the entire website */}
        <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden flex items-center justify-center">
          <div className="relative h-[85vh] w-[85vw] max-w-[1100px] opacity-[0.065] mix-blend-multiply select-none transform-gpu scale-105">
            <Image
              src="/amvi-logo.png"
              alt="AMVI Watermark"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>

        {/* Global Client Shell */}
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
