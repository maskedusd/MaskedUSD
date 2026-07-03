import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import LegalDoc, { type LegalContent } from "@/components/LegalDoc";
import Footer from "@/components/Footer";
import privacy from "@/content/legal/privacy.json";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How the MaskedUSD website handles information — non-custodial, no accounts, no tracking. What is public on-chain, what stays in your browser, and the narrow cases where any data is handled.",
  openGraph: {
    title: "MaskedUSD — Privacy Policy",
    description:
      "A non-custodial protocol that holds almost no data: no accounts, no KYC, no tracking cookies. Read how information is (and isn't) handled.",
    type: "article",
  },
};

export default function PrivacyPage() {
  return (
    <>
      <SiteHeader entered />
      <LegalDoc doc={privacy as LegalContent} />
      <Footer />
    </>
  );
}
