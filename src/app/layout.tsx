import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { PostSigninSync } from "@/components/atoms/PostSigninSync";
import { Footer } from "@/components/layout/Footer";
import { CookieConsent } from "@/components/molecules/CookieConsent";
import { AdSenseLoader } from "@/components/layout/AdSenseLoader";
import { clientEnv } from "@/lib/env.client";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteVerification = clientEnv.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;

export const metadata: Metadata = {
  title: "TruePrice — What Products Actually Cost",
  description:
    "Discover the real cost of any product — raw materials, labor, and overhead — so you know exactly how much of a markup you're paying.",
  ...(siteVerification && {
    verification: { google: siteVerification },
  }),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const adSensePublisherId = clientEnv.NEXT_PUBLIC_ADSENSE_CLIENT;

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <QueryProvider>
            {children}
            <PostSigninSync />
          </QueryProvider>
        </AuthProvider>
        <Footer />
        <CookieConsent />
        {adSensePublisherId && (
          <AdSenseLoader publisherId={adSensePublisherId} />
        )}
      </body>
    </html>
  );
}
