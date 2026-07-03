import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import LegalDoc, { type LegalContent } from "@/components/LegalDoc";
import Footer from "@/components/Footer";
import terms from "@/content/legal/terms.json";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "The terms that govern use of the MaskedUSD website, protocol interface, and software: non-custodial and immutable, assumption of risk, $USDM and $MUSD nature, lawful-use privacy, and disclaimers.",
  openGraph: {
    title: "MaskedUSD — Terms of Service",
    description:
      "Non-custodial, immutable contracts on Base. Assumption of risk, token disclaimers, lawful-use privacy, and limitations of liability.",
    type: "article",
  },
};

export default function TermsPage() {
  return (
    <>
      <SiteHeader entered />
      <LegalDoc doc={terms as LegalContent} />
      <Footer />
    </>
  );
}
