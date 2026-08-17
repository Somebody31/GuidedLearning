// Root layout: fonts, theme script, and the HTML shell.

import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono, Source_Serif_4 } from "next/font/google";
import { THEME_BOOT_SCRIPT } from "@/lib/prefs";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "GuidedLearning",
    template: "%s · GuidedLearning",
  },
  description:
    "Turn textbooks and lecture PDFs into adaptive unit–lesson paths with grounded lessons and spaced review.",
  applicationName: "GuidedLearning",
  openGraph: {
    title: "GuidedLearning",
    description:
      "From PDFs to a living course path — grounded lessons and adaptive spaced review.",
    type: "website",
  },
  other: {
    "color-scheme": "dark light",
  },
};

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f4f6" },
    { media: "(prefers-color-scheme: dark)", color: "#07070a" },
  ],
  colorScheme: "dark light" as const,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-theme="dark"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${sourceSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Script
          id="gl-theme-boot"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }}
        />
        {children}
      </body>
    </html>
  );
}
