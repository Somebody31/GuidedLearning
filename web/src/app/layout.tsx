// Root layout: fonts, theme script, and the HTML shell.

import type { Metadata } from "next";
import Script from "next/script";
import { Geist_Mono, Manrope, Source_Serif_4 } from "next/font/google";
import { THEME_BOOT_SCRIPT } from "@/lib/prefs";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
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
    "Turn textbooks, lecture PDFs, or a folder of code into a study path with grounded lessons and spaced review.",
  applicationName: "GuidedLearning",
  openGraph: {
    title: "GuidedLearning",
    description:
      "Upload your files. Confirm the path. Study what is due today.",
    type: "website",
  },
  other: {
    "color-scheme": "light dark",
  },
};

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#e4e6ec" },
    { media: "(prefers-color-scheme: dark)", color: "#101216" },
  ],
  colorScheme: "light dark" as const,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-theme="light"
      suppressHydrationWarning
      className={`${manrope.variable} ${geistMono.variable} ${sourceSerif.variable} h-full antialiased`}
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
