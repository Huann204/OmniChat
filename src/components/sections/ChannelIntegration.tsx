import { Section } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";
import { FadeIn } from "@/components/ui/FadeIn";
import { FaInstagram, FaWhatsapp, FaTelegramPlane, FaGoogle } from "react-icons/fa";
import { Globe } from "lucide-react";

export function ChannelIntegration() {
  const channels = [
    {
      name: "Facebook Messenger",
      description: "Chăm sóc khách hàng từ Fanpage",
      icon: <img src="/facebook.png" alt="Facebook" className="h-8 w-8 object-contain" />,
      color: "hover:border-[#1877F2]/30",
    },
    {
      name: "Zalo OA",
      description: "Tương tác với khách hàng trên Zalo",
      icon: <img src="/zalo.png" alt="Zalo" className="h-8 w-8 object-contain" />,
      color: "hover:border-[#0068FF]/30",
    },
    {
      name: "Zalo Personal",
      description: "Quản lý tin nhắn Zalo cá nhân",
      icon: <img src="/zalo.png" alt="Zalo" className="h-8 w-8 object-contain" />,
      color: "hover:border-[#0068FF]/30",
    },
    {
      name: "Instagram",
      description: "Trả lời DM và comment tự động",
      icon: (
        <FaInstagram className="h-8 w-8 text-transparent bg-clip-text bg-gradient-to-tr from-[#f09433] via-[#e6683c] to-[#bc1888]" />
      ),
      color: "hover:border-[#bc1888]/30",
    },
    {
      name: "WhatsApp",
      description: "Kết nối khách hàng quốc tế",
      icon: <FaWhatsapp className="h-8 w-8 text-[#25D366]" />,
      color: "hover:border-[#25D366]/30",
    },
    {
      name: "Telegram",
      description: "Quản lý group và tin nhắn",
      icon: <FaTelegramPlane className="h-8 w-8 text-[#2AABEE]" />,
      color: "hover:border-[#2AABEE]/30",
    },
    {
      name: "Website Webchat",
      description: "Livechat trực tiếp trên website",
      icon: <Globe className="h-8 w-8 text-primary" />,
      color: "hover:border-primary/30",
    },
    {
      name: "Google Business",
      description: "Tin nhắn từ Google Maps & Search",
      icon: <FaGoogle className="h-8 w-8 text-[#DB4437]" />,
      color: "hover:border-[#DB4437]/30",
    },
  ];

  return (
    <Section className="bg-slate-50/50">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <FadeIn delay={0.1}>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-slate-900 mb-6">
            Tích hợp tất cả kênh bán hàng của bạn
          </h2>
        </FadeIn>
        <FadeIn delay={0.2}>
          <p className="text-lg md:text-xl text-slate-600">
            Không còn bỏ sót tin nhắn. Hchat gom tất cả hội thoại về một nền tảng duy nhất, giúp đội ngũ hỗ trợ nhanh hơn 300%.
          </p>
        </FadeIn>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[300px] bg-gradient-to-r from-blue-100/40 via-purple-100/40 to-blue-100/40 blur-[100px] pointer-events-none -z-10" />
        
        {channels.map((channel, index) => (
          <FadeIn key={channel.name} delay={0.1 * (index % 4)}>
            <Card 
              className={`p-6 flex flex-col items-center text-center gap-4 transition-all duration-500 hover:-translate-y-2 cursor-pointer bg-white/60 hover:bg-white group ${channel.color}`}
            >
              <div className="h-16 w-16 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                {channel.icon}
              </div>
              <div>
                <h3 className="font-bold text-slate-900 mb-1">{channel.name}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{channel.description}</p>
              </div>
            </Card>
          </FadeIn>
        ))}
      </div>
    </Section>
  );
}
