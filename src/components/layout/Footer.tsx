import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { FaFacebook, FaYoutube } from "react-icons/fa";

export function Footer() {
  const footerLinks = [
    {
      title: "Sản phẩm",
      links: ["Tính năng", "AI Chatbot", "Omnichannel", "Bảng giá", "Khách hàng"],
    },
    {
      title: "Tích hợp",
      links: ["Facebook Messenger", "Zalo OA", "WhatsApp", "Instagram", "Website"],
    },
    {
      title: "Tài nguyên",
      links: ["Hướng dẫn sử dụng", "API Docs", "Blog", "Webinar", "Cộng đồng"],
    },
    {
      title: "Công ty",
      links: ["Về chúng tôi", "Tuyển dụng", "Liên hệ", "Đối tác", "Điều khoản"],
    },
  ];

  return (
    <footer className="bg-white border-t border-slate-200 pt-16 pb-8 text-slate-600 relative z-20">
      <div className="mx-auto w-full max-w-7xl px-4 md:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-5 xl:gap-12">
          {/* Brand Column */}
          <div className="col-span-2 lg:col-span-1 flex flex-col gap-4">
            <Link href="/" className="flex items-center gap-2">
              <img src="/logo.png" alt="OmniChat Logo" className="h-8 w-auto" />
              <span className="text-xl font-bold text-slate-900 tracking-tight">OmniChat</span>
            </Link>
            <p className="text-sm text-slate-500 mt-2">
              Nền tảng quản lý tin nhắn đa kênh và chatbot AI dành cho doanh nghiệp tại Việt Nam.
            </p>
            <div className="flex gap-4 mt-4">
              <a href="#" className="text-slate-400 hover:text-primary transition-colors">
                <FaFacebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-slate-400 hover:text-primary transition-colors">
                <MessageCircle className="h-5 w-5" />
              </a>
              <a href="#" className="text-slate-400 hover:text-primary transition-colors">
                <FaYoutube className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Links Columns */}
          {footerLinks.map((column) => (
            <div key={column.title} className="flex flex-col gap-4">
              <h4 className="font-semibold text-slate-900">{column.title}</h4>
              <ul className="flex flex-col gap-2">
                {column.links.map((link) => (
                  <li key={link}>
                    <Link href="#" className="text-sm hover:text-primary transition-colors">
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 pt-8 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500">
            © 2025 OmniChat. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-slate-500">
            <Link href="#" className="hover:text-slate-900">Chính sách bảo mật</Link>
            <Link href="#" className="hover:text-slate-900">Điều khoản dịch vụ</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
