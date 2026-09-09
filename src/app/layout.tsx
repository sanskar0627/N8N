import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Provider } from "jotai"
import { TRPCReactProvider } from "@/trpc/client"
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Toaster } from "sonner";
import { SoftwareApplicationJsonLd, WebSiteJsonLd } from "@/components/seo/json-ld";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = process.env.BETTER_AUTH_URL || "https://m9m.sanskarshukla.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "M9M — Visual Workflow Automation Platform",
    template: "%s | M9M",
  },
  description:
    "Build, automate, and orchestrate complex workflows visually. Connect AI models, APIs, and services with a powerful drag-and-drop editor. Self-hostable, open-source alternative to n8n and Zapier.",
  keywords: [
    "workflow automation",
    "visual workflow builder",
    "n8n alternative",
    "zapier alternative",
    "AI workflow",
    "automation platform",
    "drag and drop automation",
    "API orchestration",
    "self-hosted automation",
    "no-code automation",
  ],
  authors: [{ name: "Sanskar Shukla", url: "https://sanskarshukla.com" }],
  creator: "Sanskar Shukla",
  publisher: "Sanskar Shukla",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: "M9M",
    title: "M9M — Visual Workflow Automation Platform",
    description:
      "Build, automate, and orchestrate complex workflows visually. Connect AI models, APIs, and services with a powerful drag-and-drop editor.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "M9M Workflow Automation Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "M9M — Visual Workflow Automation Platform",
    description:
      "Build, automate, and orchestrate complex workflows visually with AI-powered nodes.",
    creator: "@sanskar0627",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: SITE_URL,
  },
  icons: {
    icon: "/logo/logo.png",
    apple: "/logo/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <TRPCReactProvider>
            <NuqsAdapter>
              <Provider>
                {children}
                <Toaster />
              </Provider>
            </NuqsAdapter>
          </TRPCReactProvider>
              <SoftwareApplicationJsonLd />
        <WebSiteJsonLd />
      </body>
    </html>
  );
}
