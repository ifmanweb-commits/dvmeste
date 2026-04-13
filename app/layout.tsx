import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { LayoutShell } from "@/components/layout/LayoutShell";
import BlockRenderer from "@/components/BlockRenderer";

import {
  buildMetadata,
  webSiteJsonLd,
  organizationJsonLd,
} from "@/lib/seo";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
});

const displayFont = Plus_Jakarta_Sans({
  variable: "--font-display",
  weight: ["600", "700", "800"],
  subsets: ["latin", "cyrillic-ext"],
});

export const viewport: Viewport = {
  themeColor: "#5858E2",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  ...buildMetadata({
    title: "Давай вместе — Каталог психологов",
    description:
      "Подберите психолога по парадигме, цене и городу. Фильтры, уровни сертификации, удобный каталог. Сервис «Давай вместе».",
    path: "/",
  }),
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BASE_URL ?? "https://davay-vmeste.example.com"
  ),
  applicationName: "Давай вместе",
  keywords: [
    "психолог",
    "каталог психологов",
    "подбор психолога",
    "психотерапия",
    "консультация психолога",
    "КПТ",
    "гештальт",
    "сертификация",
  ],
  authors: [{ name: "Давай вместе" }],
  creator: "Давай вместе",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const webSiteSchema = webSiteJsonLd();
  const organizationSchema = organizationJsonLd();

  return (
    <html className="scroll-smooth" lang="ru">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: webSiteSchema }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: organizationSchema }}
        />
        {/* Динамические блоки для head — загружаются по slug'ам */}
        <BlockRenderer slugs={['head-scripts']} variant="head" />
      </head>
      <body
        className={`${inter.variable} ${displayFont.variable} font-sans antialiased`}
      >
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded focus:bg-primary focus:px-3 focus:py-2 focus:text-white"
        >
          Перейти к содержимому
        </a>
        <LayoutShell>{children}</LayoutShell>
        
        {/* Блок body-end перед закрывающим тегом body */}
        <BlockRenderer slugs={['body-end']} variant="body" />
      </body>
    </html>
  );
}
