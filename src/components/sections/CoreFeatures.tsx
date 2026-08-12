import { Section } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";
import { FadeIn } from "@/components/ui/FadeIn";
import {
  BsRobot,
  BsInboxFill,
  BsMegaphoneFill,
  BsDiagram3Fill,
  BsBullseye,
  BsController,
  BsBarChartFill,
  BsFillPeopleFill,
  BsFillCalendarDateFill,
} from "react-icons/bs";

export function CoreFeatures() {
  const features = [
    {
      title: "AI Chatbot thông minh",
      description: "Tự động trả lời 24/7, tích hợp OpenAI, tạo Knowledge Base từ tài liệu của bạn.",
      icon: <BsRobot className="h-6 w-6 text-primary" />,
    },
    {
      title: "Hộp thư hợp nhất",
      description: "Quản lý toàn bộ hội thoại đa kênh trong một inbox duy nhất, phân công nhân viên tức thì.",
      icon: <BsInboxFill className="h-6 w-6 text-primary" />,
    },
    {
      title: "Broadcast hàng loạt",
      description: "Gửi tin nhắn marketing đến hàng nghìn khách hàng trên Facebook, Zalo, Telegram.",
      icon: <BsMegaphoneFill className="h-6 w-6 text-primary" />,
    },
    {
      title: "Tự động hóa & Flow",
      description: "Xây dựng kịch bản chatbot bằng kéo thả, keyword trigger, sequence drip.",
      icon: <BsDiagram3Fill className="h-6 w-6 text-primary" />,
    },
    {
      title: "Marketing & Quảng cáo",
      description: "Tích hợp Facebook Ads, tạo quảng cáo bằng AI, remarketing tự động.",
      icon: <BsBullseye className="h-6 w-6 text-primary" />,
    },
    {
      title: "MiniGame & Viral",
      description: "Quiz, Vòng quay may mắn, Cây vàng — tăng tương tác và thu thập lead.",
      icon: <BsController className="h-6 w-6 text-primary" />,
    },
    {
      title: "Thống kê & Báo cáo",
      description: "Dashboard phân tích hiệu quả kênh, hội thoại, chiến dịch marketing.",
      icon: <BsBarChartFill className="h-6 w-6 text-primary" />,
    },
    {
      title: "Quản lý khách hàng",
      description: "CRM nhẹ, phân nhóm, gắn tag, lưu thuộc tính khách hàng.",
      icon: <BsFillPeopleFill className="h-6 w-6 text-primary" />,
    },
    {
      title: "Đặt lịch tự động",
      description: "Booking tích hợp, gửi nhắc nhở qua Zalo/Messenger.",
      icon: <BsFillCalendarDateFill className="h-6 w-6 text-primary" />,
    },
  ];

  return (
    <Section id="features">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <FadeIn delay={0.1}>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-slate-900 mb-6">
            Tính năng cốt lõi cho tăng trưởng
          </h2>
        </FadeIn>
        <FadeIn delay={0.2}>
          <p className="text-lg md:text-xl text-slate-600">
            Mọi công cụ bạn cần để biến khách hàng tiềm năng thành người mua hàng trung thành.
          </p>
        </FadeIn>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-primary/5 blur-[120px] rounded-full pointer-events-none -z-10" />
        
        {features.map((feature, index) => (
          <FadeIn key={index} delay={0.1 * (index % 3)}>
            <Card className="p-8 h-full group bg-white/60 hover:bg-white transition-colors duration-500">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100/50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 shadow-sm">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-primary transition-colors duration-300">{feature.title}</h3>
              <p className="text-slate-600 leading-relaxed text-base">{feature.description}</p>
            </Card>
          </FadeIn>
        ))}
      </div>
    </Section>
  );
}
