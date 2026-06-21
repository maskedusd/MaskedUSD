import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import FlashToast from "@/components/web3/FlashToast";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const description =
  "Privacy stablecoin infrastructure on Base. 1:1 USDC-backed $USDM, shielded by dZK Proof.";

export const metadata: Metadata = {
  metadataBase: new URL("https://maskedusd.com"),
  // Landing page → "MaskedUSD"; other pages → "MaskedUSD // <Page>".
  title: {
    default: "MaskedUSD",
    template: "MaskedUSD // %s",
  },
  description,
  openGraph: {
    title: "MaskedUSD",
    description,
    url: "https://maskedusd.com",
    siteName: "MaskedUSD",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    site: "@MaskedUSD",
    title: "MaskedUSD",
    description,
  },
};

export const viewport: Viewport = {
  themeColor: "#f6f2fb",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <FlashToast />
      </body>
    </html>
  );
}
