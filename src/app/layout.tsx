import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

const jakartaSans = Plus_Jakarta_Sans({
  variable: "--font-jakarta-sans",
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "OmniChat | Nền tảng quản lý tin nhắn và AI Chatbot",
  description: "Quản lý tất cả tin nhắn khách hàng trong một nơi. Tự động hóa bán hàng với AI Chatbot thông minh trên Facebook, Zalo, Instagram, WhatsApp, và Website.",
  openGraph: {
    title: "OmniChat | Nền tảng quản lý tin nhắn và AI Chatbot",
    description: "Quản lý tất cả tin nhắn khách hàng trong một nơi. Tự động hóa bán hàng với AI Chatbot thông minh.",
    type: "website",
    locale: "vi_VN",
    url: "https://omnichat.vn",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${jakartaSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <Header />
        <main className="flex-1 flex flex-col">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
