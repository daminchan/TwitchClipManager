import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { QueryProvider } from "@/components/providers/query-provider";
import { SessionProvider } from "@/components/providers/session-provider";
import { ProgressBarProvider } from "@/components/providers/progress-bar-provider";
import { APP_CONFIG } from "@/lib/constants";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: APP_CONFIG.seo.title,
    template: `%s | ${APP_CONFIG.name}`,
  },
  description: APP_CONFIG.seo.description,
  keywords: [...APP_CONFIG.seo.keywords],
  openGraph: {
    title: APP_CONFIG.seo.title,
    description: APP_CONFIG.seo.description,
    url: APP_CONFIG.url,
    siteName: APP_CONFIG.name,
    locale: 'ja_JP',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: APP_CONFIG.seo.title,
    description: APP_CONFIG.seo.description,
  },
  robots: {
    index: true,
    follow: true,
  },
};

// JSON-LD構造化データ
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: APP_CONFIG.name,
  description: APP_CONFIG.seo.description,
  url: APP_CONFIG.url,
  applicationCategory: 'EntertainmentApplication',
  operatingSystem: 'Web',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'JPY',
  },
  inLanguage: 'ja',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="dark">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-900 text-gray-100`}
      >
        <ProgressBarProvider>
          <QueryProvider>
            <SessionProvider>{children}</SessionProvider>
          </QueryProvider>
        </ProgressBarProvider>
      </body>
    </html>
  );
}
