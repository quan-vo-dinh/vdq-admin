import React from "react";
import type { Metadata } from "next";
import { Geist } from "next/font/google";

import "./globals.css"
import "./css/mobile-layout.css"
import NextTopLoader from "nextjs-toploader";
import { ThemeProvider } from "@/components/Themeprovider";
import { OfflineBanner } from "@/app/components/shared/offline-banner";
import { LanguageProvider } from "@/app/context/language-context";


const geist = Geist({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist",
});

export const metadata: Metadata = {
  title: "bin | Vo Dinh Quan",
  description: "Full-stack Engineer working with ASP.NET Core and React.",
   openGraph: {
    title: "bin | Vo Dinh Quan",
    description: "Full-stack Engineer working with ASP.NET Core and React.",
    images: [
      {
        url: "/OG-Image.png",
        width: 1200,
        height: 630,
        alt: "ShadcnDashboard Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/OG-Image.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (

    <html lang="vi" suppressHydrationWarning
      data-color-theme="CUSTOM_THEME"
      data-layout="vertical"
      data-boxed-layout="full"
      data-sidebar-type="true"
      data-card-shadow="false"
      className="style-lyra"
    >
      <head>
        <link rel="icon" href="/favicons.ico" type="image/svg+xml" />
      </head>
      <body className={`${geist.className} `} >
        <NextTopLoader color="var(--primary)" showSpinner={false} />
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
        >
          <LanguageProvider>
            {children}
            <OfflineBanner />
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>

  );
}
