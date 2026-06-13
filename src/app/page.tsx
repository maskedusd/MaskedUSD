import IntroGate from "@/components/IntroGate";
import HowItWorks from "@/components/HowItWorks";
import WhyPrivacy from "@/components/WhyPrivacy";
import TokenComparison from "@/components/TokenComparison";
import Roadmap from "@/components/Roadmap";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      {/* lavender */}
      <IntroGate />
      {/* white */}
      <HowItWorks />
      {/* lavender */}
      <WhyPrivacy />
      {/* white */}
      <TokenComparison />
      {/* lavender */}
      <Roadmap />
      {/* white */}
      <FAQ />
      {/* lavender (deeper) — closing band */}
      <Footer />
    </>
  );
}
