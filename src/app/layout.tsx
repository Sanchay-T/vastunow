import type { Metadata, Viewport } from "next";
import { Montserrat, Playfair_Display } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import ClientProviders from "./providers";

const montserrat = Montserrat({
  variable: "--font-body",
  subsets: ["latin"],
});

const playfairDisplay = Playfair_Display({
  variable: "--font-heading",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "My Vaastu Pandit — Free Vaastu Analysis for Your Floor Plan",
  description: "Upload your floor plan, get an instant Vaastu Shastra score and detailed analysis with remedies. Analyse. Remedy. Prosper.",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${montserrat.variable} ${playfairDisplay.variable} antialiased bg-[var(--background)] text-[var(--foreground)]`}>
        <ClientProviders>
          {children}
        </ClientProviders>
        <Script id="ms-clarity" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "wlto1f2a94");
          `}
        </Script>
      </body>
    </html>
  );
}
