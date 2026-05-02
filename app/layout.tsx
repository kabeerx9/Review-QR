import type { Metadata } from "next";
import { Fraunces, Manrope } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ReviewQR | Get More 5-Star Google Reviews Automatically",
  description:
    "ReviewQR helps local businesses increase Google ratings. Our smart QR code flow routes happy customers to Google and intercepts unhappy ones for private feedback.",
  keywords: ["Google reviews", "reputation management", "QR code reviews", "local SEO", "get 5 star reviews"],
  metadataBase: new URL("https://reviewqr.com"), // Replace with actual domain
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "ReviewQR | Get More 5-Star Google Reviews Automatically",
    description: "Turn your daily footfall into permanent digital reputation. Get more 5-star reviews and intercept bad feedback.",
    url: 'https://reviewqr.com',
    siteName: 'ReviewQR',
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ReviewQR | Get More 5-Star Google Reviews Automatically',
    description: 'Turn your daily footfall into permanent digital reputation. Get more 5-star reviews and intercept bad feedback.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${manrope.variable} ${fraunces.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
