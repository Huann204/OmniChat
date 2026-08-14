import type { ComponentType, SVGProps } from "react";
import {
  SiAirbnb,
  SiBookingdotcom,
  SiFacebook,
  SiInstagram,
  SiShopee,
  SiTelegram,
  SiThreads,
  SiTiktok,
  SiWhatsapp,
  SiYoutube,
  SiZalo,
} from "react-icons/si";

export interface ConnectionPlatform {
  key: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  imageSrc?: string;
  /** CSS background (màu hoặc gradient) cho icon huy hiệu */
  badgeBg: string;
  /** Màu icon dùng trên nền trắng (nút kết nối) */
  accent: string;
  beta?: boolean;
  description: string;
}

export const CONNECTION_PLATFORMS: ConnectionPlatform[] = [
  {
    key: "facebook",
    label: "Facebook",
    icon: SiFacebook,
    imageSrc: "/facebook.png",
    badgeBg: "#0866FF",
    accent: "#0866FF",
    description:
      "Mở khoá mục tiêu mua hàng qua tin nhắn trên Ads Manager, tự động tối ưu quảng cáo Facebook với CAPI.",
  },
  {
    key: "zalo-personal",
    label: "Zalo",
    icon: SiZalo,
    imageSrc: "/zalo.png",
    badgeBg: "#0068FF",
    accent: "#0068FF",
    description: "Quét mã QR để kết nối tài khoản Zalo cá nhân, nhận và trả lời tin nhắn ngay trong hộp thư chung.",
  },
  {
    key: "telegram",
    label: "Telegram",
    icon: SiTelegram,
    imageSrc: "/tele.png",
    badgeBg: "#0088cc",
    accent: "#0088cc",
    description: "Quét mã QR để kết nối tài khoản Telegram cá nhân, nhận và trả lời tin nhắn ngay trong hộp thư chung.",
  },
  {
    key: "instagram",
    label: "Instagram",
    icon: SiInstagram,
    imageSrc: "/instagram.png",
    badgeBg: "linear-gradient(45deg, #f9ce34, #ee2a7b, #6228d7)",
    accent: "#E1306C",
    description: "Quản lý tin nhắn, bình luận trên Instagram ngay trong một nơi duy nhất.",
  },
  {
    key: "threads",
    label: "Threads",
    icon: SiThreads,
    imageSrc: "/thread.png",
    badgeBg: "#000000",
    accent: "#000000",
    beta: true,
    description: "Trả lời bình luận và tin nhắn từ Threads tự động cùng các kênh khác.",
  },
  {
    key: "tiktok",
    label: "TikTok",
    icon: SiTiktok,
    imageSrc: "/tiktok.png",
    badgeBg: "#000000",
    accent: "#000000",
    description: "Đồng bộ tin nhắn TikTok Shop và bình luận video để chăm sóc khách hàng nhanh hơn.",
  },
  {
    key: "whatsapp",
    label: "WhatsApp",
    icon: SiWhatsapp,
    imageSrc: "/whatsapp.png",
    badgeBg: "#25D366",
    accent: "#25D366",
    description: "Kết nối số WhatsApp Business để nhắn tin và tự động hoá chăm sóc khách hàng.",
  },
  {
    key: "booking",
    label: "Booking",
    icon: SiBookingdotcom,
    badgeBg: "#003580",
    accent: "#003580",
    beta: true,
    description: "Nhận và trả lời tin nhắn đặt phòng từ Booking.com ngay trong hộp thư chung.",
  },
  {
    key: "airbnb",
    label: "Airbnb",
    icon: SiAirbnb,
    badgeBg: "#FF5A5F",
    accent: "#FF5A5F",
    beta: true,
    description: "Đồng bộ tin nhắn khách thuê từ Airbnb để không bỏ lỡ yêu cầu đặt phòng nào.",
  },
  {
    key: "youtube",
    label: "YouTube",
    icon: SiYoutube,
    imageSrc: "/youtube.png",
    badgeBg: "#FF0000",
    accent: "#FF0000",
    beta: true,
    description: "Quản lý bình luận video YouTube và trả lời khán giả tự động.",
  },
  {
    key: "shopee",
    label: "Shopee",
    icon: SiShopee,
    imageSrc: "/shoppe.png",
    badgeBg: "#EE4D2D",
    accent: "#EE4D2D",
    description: "Đồng bộ tin nhắn và đơn hàng Shopee để chăm sóc khách mua sắm kịp thời.",
  },
  // {
  //   key: "zalo",
  //   label: "Zalo",
  //   icon: SiZalo,
  //   imageSrc: "/zalo.png",
  //   badgeBg: "#0068FF",
  //   accent: "#0068FF",
  //   beta: true,
  //   description: "Kết nối Official Account để nhắn tin và chăm sóc khách hàng qua Zalo.",
  // },
];
