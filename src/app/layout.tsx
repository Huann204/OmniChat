import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Roboto } from "next/font/google";
import "./globals.css";
import { AuthSessionProvider } from "@/components/auth/AuthSessionProvider";
import { Toaster } from "@/components/ui/Toaster";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

const jakartaSans = Plus_Jakarta_Sans({
  variable: "--font-jakarta-sans",
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "500", "600", "700"],
});

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "500", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Hchat | Nền tảng quản lý tin nhắn và AI Chatbot",
    template: "%s | Hchat",
  },
  description: "Quản lý tất cả tin nhắn khách hàng trong một nơi. Tự động hóa bán hàng với AI Chatbot thông minh trên Facebook, Zalo, Instagram, WhatsApp, và Website.",
  icons: {
    icon: "/favi.png",
    shortcut: "/favi.png",
    apple: "/favi.png",
  },
  openGraph: {
    title: "Hchat | Nền tảng quản lý tin nhắn và AI Chatbot",
    description: "Quản lý tất cả tin nhắn khách hàng trong một nơi. Tự động hóa bán hàng với AI Chatbot thông minh.",
    type: "website",
    locale: "vi_VN",
    url: "https://hchat.site",
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
      className={`${jakartaSans.variable} ${roboto.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <AuthSessionProvider>{children}</AuthSessionProvider>
        <Toaster />
      </body>
    </html>
  );
}
