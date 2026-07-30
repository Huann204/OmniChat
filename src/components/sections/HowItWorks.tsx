import { Section } from "@/components/ui/Section";
import { FadeIn } from "@/components/ui/FadeIn";
import { Link2, Settings, MessageSquarePlus } from "lucide-react";

export function HowItWorks() {
  const steps = [
    {
      number: "01",
      title: "Kết nối kênh",
      description: "Tích hợp Facebook, Zalo, WhatsApp và Website chỉ với vài click chuột.",
      icon: <Link2 className="h-8 w-8 text-[#0866FF]" />,
    },
    {
      number: "02",
      title: "Cài đặt Chatbot",
      description: "Thiết lập kịch bản tự động, AI bot và từ khóa để phản hồi khách hàng 24/7.",
      icon: <Settings className="h-8 w-8 text-[#0866FF]" />,
    },
    {
      number: "03",
      title: "Bắt đầu tương tác",
      description: "Nhận tin nhắn, xử lý hội thoại và chạy các chiến dịch marketing tự động.",
      icon: <MessageSquarePlus className="h-8 w-8 text-[#0866FF]" />,
    },
  ];

  return (
    <Section className="bg-slate-50/50 relative">
      <div className="text-center max-w-3xl mx-auto mb-20 relative z-10">
        <FadeIn delay={0.1}>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tighter text-slate-900 mb-6">
            Bắt đầu trong 3 bước đơn giản
          </h2>
        </FadeIn>
        <FadeIn delay={0.2}>
          <p className="text-lg md:text-xl text-slate-600">
            Không cần kiến thức lập trình. Cài đặt và sử dụng ngay lập tức.
          </p>
        </FadeIn>
      </div>

      <div className="relative z-10">
        {/* Connector Line (Desktop Only) */}
        <FadeIn delay={0.3} className="hidden md:block absolute top-8 left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-blue-100 via-[#0866FF]/40 to-blue-100 z-0" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 relative z-10">
          {steps.map((step, index) => (
            <FadeIn key={index} delay={0.2 * (index + 1)} className="flex flex-col items-center text-center group">
              <div className="h-16 w-16 rounded-2xl bg-white shadow-lg shadow-blue-900/5 border border-slate-200/60 flex items-center justify-center mb-8 relative group-hover:-translate-y-1 transition-transform duration-300">
                <span className="absolute -top-3 -right-3 h-8 w-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm font-bold shadow-md">
                  {step.number}
                </span>
                {step.icon}
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{step.title}</h3>
              <p className="text-slate-600 leading-relaxed px-4">{step.description}</p>
            </FadeIn>
          ))}
        </div>
      </div>
    </Section>
  );
}
