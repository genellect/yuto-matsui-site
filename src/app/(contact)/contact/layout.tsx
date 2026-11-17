import { LinkerUrlCleanup, linkerReadyAfterAnalytics } from "../../../shared/analytics/LinkerUrlCleanup";
import type { Metadata, Viewport } from "next";
import Script from "next/script";
import type { ReactNode } from "react";
import { COMPASS_PARENT_GA_MEASUREMENT_ID, site } from "../../../site";
import { contactMetadataCopy } from "../../../contact/copy";
// The ported Contact surface was designed on top of these inherited styles; keep their order.
import "../../../inherited/styles/legacy.css";
import "../../../inherited/styles/hero.css";
import "../../../inherited/styles/desktop-system.css";
import "../../../inherited/styles/official-immersive.css";
import "../../../inherited/styles/official-four-directions.css";
import "../../../inherited/styles/official-core-redesign.css";
import "../../../inherited/styles/official-brand-system.css";
import "../../../inherited/styles/living-intelligence-hero.css";
import "../../../inherited/styles/github-profile-link.css";

const canonical = `${site.origin}/contact/`;

export const metadata: Metadata = {
  metadataBase: new URL(site.origin),
  title: contactMetadataCopy.title,
  description: contactMetadataCopy.description,
  authors: [{ name: "Yuto Matsui / 松井優知" }],
  alternates: { canonical },
  robots: { index: false, follow: true },
  icons: {
    icon: [{ url: "/images/compass-mark.svg?v=20260713", type: "image/svg+xml", sizes: "any" }]
  },
  openGraph: {
    locale: "ja_JP",
    type: "website",
    siteName: "Yuto Matsui",
    title: contactMetadataCopy.title,
    description: contactMetadataCopy.description,
    url: canonical
  },
  twitter: {
    card: "summary",
    title: contactMetadataCopy.title,
    description: contactMetadataCopy.description
  },
  formatDetection: { telephone: false }
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#f6f8f7" };

export default function ContactLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <head>
        <LinkerUrlCleanup />
        <script dangerouslySetInnerHTML={{ __html: 'document.documentElement.classList.add("js")' }} />
      </head>
      <body>
        {children}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${COMPASS_PARENT_GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
        <Script id="portfolio-contact-analytics" strategy="afterInteractive">
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
