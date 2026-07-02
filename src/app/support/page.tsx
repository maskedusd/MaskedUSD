import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import SupportMain from "@/components/SupportMain";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Support",
  description:
    "Get help with MaskedUSD. Community-first support — reach the team on Telegram, follow updates on X, or browse the FAQ.",
};

export default function SupportPage() {
  return (
    <>
      <SiteHeader entered />
      <SupportMain />
      <Footer />
    </>
  );
}
