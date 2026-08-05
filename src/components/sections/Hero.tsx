import { Button } from "@/components/ui/Button";
import { Section } from "@/components/ui/Section";
import { FadeIn } from "@/components/ui/FadeIn";
import { PlayCircle, MessageCircle, Bot, Users, ArrowRight } from "lucide-react";

export function Hero() {
  return (
    <Section className="pt-32 pb-16 md:pt-40 md:pb-24 overflow-hidden relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-primary/15 to-transparent -z-10 blur-[100px] pointer-events-none rounded-full" />
      
      <div className="flex flex-col items-center text-center max-w-5xl mx-auto space-y-8">
        
        <FadeIn delay={0.1}>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50/80 border border-blue-100/50 text-primary text-sm font-semibold mb-2">
            <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse"></span>
            Hchat AI 2.0 đã ra mắt
            <ArrowRight className="h-4 w-4 ml-1" />
          </div>
        </FadeIn>

        <FadeIn delay={0.2}>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tighter text-slate-900 leading-[1.1] max-w-4xl">
            Quản lý tất cả tin nhắn khách hàng trong <span className="text-gradient">một nơi</span>
          </h1>
        </FadeIn>
        
        <FadeIn delay={0.3}>
          <p className="text-lg md:text-xl text-slate-600 max-w-2xl leading-relaxed">
            Hchat kết nối Facebook, Zalo, Instagram, WhatsApp và Website. Tự động hóa bán hàng với AI Chatbot thông minh, tăng x3 tỷ lệ chốt đơn.
          </p>
        </FadeIn>
        
        <FadeIn delay={0.4}>
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto mt-4">
            <Button size="lg" className="w-full sm:w-auto h-14 px-8 text-base">
              Bắt đầu dùng thử miễn phí
            </Button>
            <Button size="lg" variant="outline" className="w-full sm:w-auto gap-2 h-14 px-8 text-base border-slate-200 hover:bg-slate-50 hover:text-slate-900 bg-white shadow-sm">
              <PlayCircle className="h-5 w-5" />
              Xem demo thực tế
            </Button>
          </div>
          <p className="text-sm text-slate-500 font-medium mt-6">
            Miễn phí 14 ngày • Không cần thẻ tín dụng • Setup trong 5 phút
          </p>
        </FadeIn>

        {/* CSS Mockup Dashboard */}
        <FadeIn delay={0.6} className="w-full mt-16 relative">
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-white via-white/80 to-transparent z-20 pointer-events-none" />
          
          <div className="rounded-2xl overflow-hidden border border-slate-200/60 premium-shadow mx-auto relative bg-white aspect-[16/10] max-w-5xl flex">
            {/* Sidebar */}
            <div className="w-20 md:w-64 bg-slate-50 border-r border-slate-100 flex flex-col p-4 hidden sm:flex">
              <div className="h-8 w-full bg-slate-200/50 rounded-lg mb-8" />
              <div className="space-y-3">
                <div className="h-10 w-full bg-white rounded-lg shadow-sm border border-slate-100 flex items-center px-3 gap-3">
                  <MessageCircle className="h-5 w-5 text-primary" />
                  <div className="h-4 w-20 bg-slate-200 rounded hidden md:block" />
                </div>
                <div className="h-10 w-full bg-transparent rounded-lg flex items-center px-3 gap-3 opacity-50">
                  <Users className="h-5 w-5" />
                  <div className="h-4 w-24 bg-slate-200 rounded hidden md:block" />
                </div>
                <div className="h-10 w-full bg-transparent rounded-lg flex items-center px-3 gap-3 opacity-50">
                  <Bot className="h-5 w-5" />
                  <div className="h-4 w-16 bg-slate-200 rounded hidden md:block" />
                </div>
              </div>
            </div>
            
            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col bg-white">
              {/* Chat Header */}
              <div className="h-16 border-b border-slate-100 flex items-center px-6 gap-4">
                <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-orange-400 to-pink-500" />
                <div>
                  <div className="h-4 w-32 bg-slate-200 rounded mb-2" />
                  <div className="h-3 w-20 bg-green-100 rounded" />
                </div>
              </div>
              
              {/* Chat Messages */}
              <div className="flex-1 p-6 flex flex-col gap-6 relative">
                {/* User Message */}
                <div className="flex gap-4">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-orange-400 to-pink-500 shrink-0" />
                  <div className="bg-slate-100 rounded-2xl rounded-tl-sm p-4 w-2/3 md:w-1/2">
                    <div className="h-4 w-full bg-slate-200 rounded mb-2" />
                    <div className="h-4 w-3/4 bg-slate-200 rounded" />
                  </div>
                </div>
                
                {/* AI Message */}
                <div className="flex gap-4 flex-row-reverse">
                  <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <div className="bg-primary/10 border border-primary/20 rounded-2xl rounded-tr-sm p-4 w-2/3 md:w-1/2">
                    <div className="h-4 w-full bg-primary/20 rounded mb-2" />
                    <div className="h-4 w-5/6 bg-primary/20 rounded mb-2" />
                    <div className="h-4 w-1/2 bg-primary/20 rounded" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </FadeIn>

        {/* Social Proof */}
        <div className="mt-16 pt-8 border-t border-slate-100 w-full">
          <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-6">
            Hơn 10.000+ doanh nghiệp tin dùng
          </p>
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-60 grayscale">
            {/* Logo placeholders */}
            <div className="h-8 font-bold text-xl flex items-center">Salekit</div>
            <div className="h-8 font-bold text-xl flex items-center">KiotViet</div>
            <div className="h-8 font-bold text-xl flex items-center">Getfly</div>
            <div className="h-8 font-bold text-xl flex items-center">HubSpot</div>
          </div>
        </div>
      </div>
    </Section>
  );
}
