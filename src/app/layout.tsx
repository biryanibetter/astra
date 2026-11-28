import type { Metadata } from "next";
import type { ReactNode } from "react";
import AstraFooter from "@/components/astra-footer";
import { AstraMotionProvider } from "@/components/astra-motion-provider";
import { GlobalStarfield } from "@/components/global-starfield";
import { ScrollReveals } from "@/components/scroll-reveals";
import { Header } from "@/components/site";
import { SmoothScrollProvider } from "@/components/smooth-scroll-provider";
import { bootstrapScrollReveals } from "@/lib/reveal-bootstrap";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL || "http://localhost:3000"),
  title: {
    default: "ASTRA | Built by students. Built for what's next.",
    template: "%s | ASTRA",
  },
  description:
    "A student-led youth innovation network connecting curious, ambitious students aged 14–18 who are currently studying in Qatar.",
  openGraph: {
    type: "website",
    locale: "en_QA",
    siteName: "ASTRA Youth Innovation Network",
    title: "Built by students. Built for what's next.",
    description:
      "Find your people. Build your future. A student-led network in Qatar.",
    images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
  },
  robots:
    process.env.SITE_LIVE === "true"
      ? { index: true, follow: true }
      : { index: false, follow: false },
};

export default function RootLayout({
  children,
}: {
  readonly children: ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script
          // biome-ignore lint/security/noDangerouslySetInnerHtml: Static first-party code, no user data; must run before hydration/paint.
          dangerouslySetInnerHTML={{
            __html: `(${bootstrapScrollReveals.toString()})();`,
          }}
        />
        <link
          rel="preload"
          href="/fonts/inter.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        <ScrollReveals />
        <AstraMotionProvider>
          <GlobalStarfield>
            <a className="skip-link" href="#main">
              Skip to content
            </a>
            <Header />
            <SmoothScrollProvider>{children}</SmoothScrollProvider>
            <AstraFooter />
          </GlobalStarfield>
        </AstraMotionProvider>
      </body>
    </html>
  );
}
