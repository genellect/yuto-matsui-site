import { LinkerUrlCleanup, linkerReadyAfterAnalytics } from "../../../shared/analytics/LinkerUrlCleanup";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import type { ReactNode } from "react";
import { COMPASS_PARENT_GA_MEASUREMENT_ID, site } from "../../../site";
import "../../../inherited/styles/experience.css";
import "../../../en/english-founder-global.css";

const geist = Geist({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-en-sans"
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-en-mono"
});

export const metadata: Metadata = {
  metadataBase: new URL(site.origin),
  icons: {
    icon: [{ url: "/images/compass-mark.svg?v=20260713", type: "image/svg+xml", sizes: "any" }]
  },
  formatDetection: { telephone: false }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#000000"
};

export default function EnglishFounderLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <head><LinkerUrlCleanup /></head>
      <body>
        {children}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${COMPASS_PARENT_GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
        <Script id="yuto-english-portfolio-analytics" strategy="afterInteractive">
          {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${COMPASS_PARENT_GA_MEASUREMENT_ID}');
${linkerReadyAfterAnalytics(COMPASS_PARENT_GA_MEASUREMENT_ID)}`}
        </Script>
      </body>
    </html>
  );
}
