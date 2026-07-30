import { Section } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { FadeIn } from "@/components/ui/FadeIn";
import { BrainCircuit, CheckCircle2 } from "lucide-react";

export function AiAssistant() {
  const features = [
    "Được huấn luyện từ tài liệu, website, FAQ của bạn",
    "Trả lời tự nhiên, thông minh với GPT-4",
    "Tự động chuyển tiếp sang nhân viên khi cần thiết",
    "Hoạt động đồng bộ trên mọi kênh (Zalo, Web, Facebook)",
  ];

  return (
    <Section className="bg-slate-50 relative overflow-hidden" hasContainer={false}>
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-[500px] bg-gradient-to-r from-blue-100/40 via-cyan-100/40 to-blue-100/40 blur-[100px] rounded-full pointer-events-none" />
      
      <div className="mx-auto w-full max-w-7xl px-4 md:px-6 lg:px-8 relative z-10 py-16 md:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          <FadeIn direction="right" delay={0.2} className="order-2 lg:order-1 flex justify-center lg:justify-start">
            <div className="relative w-full max-w-md aspect-square rounded-[3rem] border border-slate-200/60 bg-white/40 flex items-center justify-center backdrop-blur-md p-8 shadow-xl">
              <div className="absolute inset-0 rounded-[3rem] border-2 border-primary/20 border-dashed animate-[spin_60s_linear_infinite]" />
              <div className="w-full h-full rounded-full bg-gradient-to-tr from-[#0866FF] to-[#00C6FF] flex items-center justify-center backdrop-blur-xl border border-white/40 premium-shadow">
                <BrainCircuit className="h-28 w-28 text-white drop-shadow-md" />
              </div>
              
              {/* Floating UI Elements */}
              <div className="absolute top-10 -right-4 md:-right-12 bg-white/90 backdrop-blur-xl border border-slate-200/60 rounded-2xl p-4 shadow-xl flex items-center gap-4 hover:-translate-y-1 transition-transform duration-500">
                <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.4)]" />
                <span className="text-sm font-semibold text-slate-800 tracking-wide">Đang trả lời 12 khách hàng...</span>
              </div>
              <div className="absolute bottom-10 -left-4 md:-left-12 bg-white/95 backdrop-blur-xl border border-slate-200/60 rounded-2xl p-5 shadow-xl max-w-[240px] hover:-translate-y-1 transition-transform duration-500">
                <p className="text-sm text-slate-600">"Sản phẩm này có hỗ trợ trả góp không shop?"</p>
                <div className="mt-3 text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#0866FF] to-[#00C6FF] uppercase tracking-wider flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-[#0866FF]" /> Đã tự động trả lời
                </div>
              </div>
            </div>
          </FadeIn>

          <div className="order-1 lg:order-2">
            <FadeIn delay={0.1}>
              <h2 className="text-3xl md:text-5xl lg:text-6xl font-extrabold tracking-tighter text-slate-900 mb-6 leading-[1.1]">
                Chatbot AI — Nhân viên bán hàng <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0866FF] to-[#00C6FF]">không bao giờ ngủ</span>
              </h2>
            </FadeIn>
            
            <FadeIn delay={0.2}>
              <p className="text-lg md:text-xl text-slate-600 mb-10 leading-relaxed max-w-xl">
                Tích hợp sức mạnh của OpenAI để tự động hóa quy trình chăm sóc khách hàng. Chatbot OmniChat hiểu ý định khách hàng và tư vấn tự nhiên như người thật.
              </p>
            </FadeIn>
            
            <ul className="space-y-5 mb-10">
              {features.map((feature, index) => (
                <FadeIn key={index} delay={0.3 + (index * 0.1)}>
                  <li className="flex items-start gap-4">
                    <div className="h-7 w-7 rounded-full bg-[#0866FF]/10 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 className="h-5 w-5 text-[#0866FF]" />
                    </div>
                    <span className="text-slate-800 font-medium text-lg">{feature}</span>
                  </li>
                </FadeIn>
              ))}
            </ul>

            <FadeIn delay={0.7}>
              <Button size="lg" className="bg-gradient-to-r from-[#0866FF] to-[#00C6FF] text-white hover:opacity-90 shadow-lg h-14 px-8 text-base">
                Kích hoạt AI ngay
              </Button>
            </FadeIn>
          </div>

        </div>
      </div>
    </Section>
  );
}
