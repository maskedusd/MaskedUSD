import IntroGate from "@/components/IntroGate";
import HowItWorks from "@/components/HowItWorks";
import WhyPrivacy from "@/components/WhyPrivacy";
import TokenComparison from "@/components/TokenComparison";
import Roadmap from "@/components/Roadmap";
import FAQ from "@/components/FAQ";

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
    </>
  );
}
