import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";

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

export const metadata: Metadata = {
  title: "Phần mềm Quản lý Tin nhắn Đa kênh & AI Chatbot Tự động",
  description:
    "Hchat là phần mềm hợp nhất tin nhắn Facebook, Zalo, Instagram, WhatsApp và Website. Tự động hóa chốt đơn và chăm sóc khách hàng 24/7 với AI Chatbot thông minh.",
  keywords: [
    "quản lý tin nhắn đa kênh",
    "ai chatbot bán hàng",
    "phần mềm quản lý trang facebook zalo",
    "tự động chốt đơn",
    "hchat",
    "chăm sóc khách hàng tự động",
  ],
  alternates: {
    canonical: "https://hchat.site",
  },
  openGraph: {
    title: "Hchat | Phần mềm Quản lý Tin nhắn Đa kênh & AI Chatbot",
    description:
      "Tự động hóa bán hàng và chăm sóc khách hàng trên Facebook, Zalo, Instagram, WhatsApp & Website. Tăng x3 tỷ lệ chốt đơn cùng Hchat AI.",
    url: "https://hchat.site",
    siteName: "Hchat",
    locale: "vi_VN",
    type: "website",
    images: [
      {
        url: "https://hchat.site/hchat.png",
        width: 1200,
        height: 630,
        alt: "Hchat - Nền tảng Quản lý Tin nhắn và AI Chatbot",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Hchat | Phần mềm Quản lý Tin nhắn Đa kênh & AI Chatbot",
    description:
      "Hợp nhất tin nhắn Facebook, Zalo, Instagram, WhatsApp. Tự động chốt đơn 24/7.",
    images: ["https://hchat.site/hchat.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function Home() {
  return (
    <>
      <JsonLd />
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
