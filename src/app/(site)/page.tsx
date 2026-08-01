import Image from "next/image";

import { Hero } from "@/components/sections/Hero";
import { ChannelIntegration } from "@/components/sections/ChannelIntegration";
import { CoreFeatures } from "@/components/sections/CoreFeatures";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { AiAssistant } from "@/components/sections/AiAssistant";
import { Pricing } from "@/components/sections/Pricing";
import { Partners } from "@/components/sections/Partners";
import { Testimonials } from "@/components/sections/Testimonials";
import { Faq } from "@/components/sections/Faq";
import { FinalCta } from "@/components/sections/FinalCta";

export default function Home() {
  return (
    <>
      <Hero />
      <ChannelIntegration />
      <CoreFeatures />
      <HowItWorks />
      <AiAssistant />
      <Pricing />
      <Partners />
      <Testimonials />
      <Faq />
      <FinalCta />
    </>
  );
}
