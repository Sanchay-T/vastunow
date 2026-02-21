import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import ClientProviders from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "VastuNow — Free Vastu Analysis for Your Floor Plan",
  description: "Upload your floor plan, get an instant Vastu Shastra score and detailed analysis with remedies. Completely free.",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} antialiased bg-[var(--background)] text-[var(--foreground)]`}>
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}
