import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import WhitepaperMain from "@/components/WhitepaperMain";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Whitepaper",
  description:
    "How MaskedUSD works: a 1:1 native-USDC-backed dollar on Base with an opt-in zero-knowledge privacy layer — architecture, the shielded pool, compliance posture, and risks.",
  openGraph: {
    title: "MaskedUSD — Whitepaper",
    description:
      "The design of a private dollar: 1:1 USDC backing, an opt-in shielded pool, in-browser zero-knowledge proofs, and privacy that complements compliance.",
    type: "article",
  },
};

export default function WhitepaperPage() {
  return (
    <>
      <SiteHeader entered />
      <WhitepaperMain />
      <Footer />
    </>
  );
}
