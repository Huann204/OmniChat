import { Button } from "@/components/ui/Button";
import { Section } from "@/components/ui/Section";
import { FadeIn } from "@/components/ui/FadeIn";
import {
  BsPlayCircleFill,
  BsChatFill,
  BsRobot,
  BsFillPeopleFill,
  BsArrowRight,
  BsStars,
  BsBagCheckFill,
  BsSearch,
  BsLockFill,
  BsCheckCircleFill,
  BsSendFill,
  BsFileTextFill,
} from "react-icons/bs";

import { PlayCircle } from "lucide-react";
export function Hero() {
  return (
    <Section className="pt-32 pb-16 md:pt-40 md:pb-24 overflow-hidden relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-primary/15 to-transparent -z-10 blur-[100px] pointer-events-none rounded-full" />

      <div className="flex flex-col items-center text-center max-w-5xl mx-auto space-y-8">

        <FadeIn delay={0.1}>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50/80 border border-blue-100/50 text-primary text-sm font-semibold mb-2">
            <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse"></span>
            Hchat AI 2.0 đã ra mắt
            <BsArrowRight className="h-4 w-4 ml-1" />
          </div>
        </FadeIn>

        <FadeIn delay={0.2}>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tighter text-slate-900 leading-[1.1] max-w-4xl">
            Quản lý tin nhắn đa kênh & <span className="text-gradient">AI Chatbot tự động</span>
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

        {/* Premium CSS Mockup Dashboard */}
        <FadeIn delay={0.6} className="w-full mt-12 relative max-w-5xl mx-auto">
          {/* Floating Highlight Badges */}
          <div className="absolute -top-5 -right-2 md:-right-6 z-30 bg-white/90 backdrop-blur-md border border-emerald-200/80 px-4 py-2 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-semibold text-slate-800 animate-bounce duration-1000">
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
            <BsStars className="h-4 w-4 text-emerald-600" />
            <span>AI Auto-Reply Active • Khách VIP 100%</span>
          </div>

          <div className="absolute -bottom-6 -left-2 md:-left-6 z-30 bg-white/90 backdrop-blur-md border border-blue-200/80 px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-3 text-xs font-semibold text-slate-800 hidden sm:flex">
            <div className="h-8 w-8 rounded-xl bg-blue-500/10 text-primary flex items-center justify-center font-bold">
              ⚡
            </div>
            <div>
              <div className="text-primary font-bold">Tăng 300% hiệu suất</div>
              <div className="text-[10px] text-slate-500 font-normal">Tự động chốt đơn Zalo & FB</div>
            </div>
          </div>

          {/* Fade gradient overlay at bottom */}
          <div className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-white via-white/70 to-transparent z-20 pointer-events-none rounded-b-3xl" />

          {/* Main Card Container */}
          <div className="rounded-3xl overflow-hidden border border-slate-200/90 shadow-[0_25px_60px_-15px_rgba(8,102,255,0.18)] relative bg-white aspect-[16/10] flex flex-col text-left text-slate-800 ring-1 ring-slate-900/5">
            {/* Mockup App Header */}
            <div className="bg-[rgb(80,109,173)] h-13 px-4 md:px-6 flex items-center justify-between shrink-0 border-b border-white/10">
              <div className="flex items-center gap-6">
                <img src="/hchat.png" alt="Hchat Logo" className="h-7 w-auto object-contain" />
                <div className="hidden sm:flex items-center gap-1.5 text-xs">
                  <span className="px-3.5 py-1.5 rounded-xl bg-white/20 text-white font-semibold shadow-xs">Hội thoại</span>
                  <span className="px-3.5 py-1.5 rounded-xl text-white/80 hover:bg-white/10 transition-colors">Đơn hàng</span>
                  <span className="px-3.5 py-1.5 rounded-xl text-white/80 hover:bg-white/10 transition-colors">Bài viết</span>
                  <span className="px-3.5 py-1.5 rounded-xl text-white/80 hover:bg-white/10 transition-colors">Thống kê</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-white/15 px-3 py-1 rounded-full text-xs text-white border border-white/10">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-medium">Shop Thời Trang HighClub</span>
                </div>
                <div className="h-8 w-8 rounded-full bg-white text-slate-700 font-bold text-xs flex items-center justify-center shadow-md">
                  H
                </div>
              </div>
            </div>

            {/* Mockup Main View */}
            <div className="flex-1 flex min-h-0 bg-white overflow-hidden">
              {/* Channel Icon Rail */}
              <div className="w-13 bg-[rgb(80,109,173)] border-r border-white/10 flex flex-col items-center py-4 gap-3 shrink-0">
                <div className="h-9 w-9 rounded-2xl bg-white/25 flex items-center justify-center text-white shadow-xs ring-2 ring-white/30">
                  <img src="/facebook.png" alt="FB" className="h-5 w-5 object-contain" />
                </div>
                <div className="h-9 w-9 rounded-2xl bg-white/10 flex items-center justify-center text-white/70 hover:bg-white/20 transition-colors">
                  <img src="/zalo.png" alt="Zalo" className="h-5 w-5 object-contain" />
                </div>
                <div className="mt-auto h-8 w-8 rounded-xl bg-white/15 flex items-center justify-center text-white/80">
                  <BsRobot className="h-4 w-4" />
                </div>
              </div>

              {/* Conversation List */}
              <div className="w-56 md:w-64 border-r border-slate-200/80 flex flex-col bg-slate-50/60 shrink-0 hidden sm:flex">
                <div className="p-3 border-b border-slate-200/80 bg-white">
                  <div className="h-8.5 rounded-xl bg-slate-100/90 px-3 flex items-center gap-2 text-xs text-slate-400 border border-slate-200/60">
                    <BsSearch className="h-3.5 w-3.5 text-slate-400" />
                    <span>Tìm kiếm hội thoại...</span>
                  </div>
                </div>

                <div className="flex-1 divide-y divide-slate-100 overflow-hidden">
                  {/* Item 1 - Active */}
                  <div className="p-3.5 bg-blue-50/90 border-l-4 border-primary flex gap-3 relative shadow-2xs">
                    <div className="relative shrink-0">
                      <img
                        src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120"
                        alt="Phương Thảo"
                        className="h-10 w-10 rounded-full object-cover ring-2 ring-white shadow-xs"
                      />
                      <img src="/facebook.png" className="absolute -bottom-0.5 -right-0.5 h-4 w-4" alt="FB" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 truncate">Phương Thảo</span>
                        <span className="text-[10px] text-primary font-bold">10:24</span>
                      </div>
                      <p className="text-[11px] text-slate-600 truncate mt-0.5">Tự động hóa gửi tin nhắn Zalo OA & FB...</p>
                      <div className="flex gap-1.5 mt-1.5">
                        <span className="text-[9px] px-2 py-0.5 bg-blue-100 text-blue-700 rounded-md font-bold">Khách Doanh Nghiệp</span>
                        <span className="text-[9px] px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-md font-bold">Tự động AI</span>
                      </div>
                    </div>
                  </div>

                  {/* Item 2 */}
                  <div className="p-3.5 flex gap-3 opacity-75 hover:bg-slate-100/60 transition-colors">
                    <div className="relative shrink-0">
                      <img
                        src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120"
                        alt="Hoàng Nam"
                        className="h-10 w-10 rounded-full object-cover"
                      />
                      <img src="/zalo.png" className="absolute -bottom-0.5 -right-0.5 h-4 w-4" alt="Zalo" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-800 truncate">Hoàng Nam</span>
                        <span className="text-[10px] text-slate-400">09:15</span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">Hướng dẫn mình kết nối API với CRM nhé!</p>
                    </div>
                  </div>

                  {/* Item 3 */}
                  <div className="p-3.5 flex gap-3 opacity-50">
                    <div className="relative shrink-0">
                      <img
                        src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120"
                        alt="Minh Trí"
                        className="h-10 w-10 rounded-full object-cover"
                      />
                      <img src="/facebook.png" className="absolute -bottom-0.5 -right-0.5 h-4 w-4" alt="FB" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-800 truncate">Vũ Minh Trí</span>
                        <span className="text-[10px] text-slate-400">Hôm qua</span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">Hchat có gửi tin nhắn Broadcast được không?</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Chat Thread */}
              <div className="flex-1 flex flex-col min-w-0 bg-white">
                {/* Chat Header */}
                <div className="h-13 border-b border-slate-100 flex items-center justify-between px-4 bg-white shrink-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120"
                      alt="Phương Thảo"
                      className="h-9 w-9 rounded-full object-cover shrink-0 ring-2 ring-slate-100"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 truncate">Phương Thảo</span>
                        <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
                      </div>
                      <p className="text-[10px] text-slate-400 truncate">FB Messenger • Vừa hoạt động</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-primary font-bold bg-blue-50 border border-blue-100/80 px-3.5 py-1.5 rounded-full shadow-xs">
                    <BsStars className="h-3.5 w-3.5 text-primary" />
                    <span>AI Chatbot Active</span>
                  </div>
                </div>

                {/* Messages Container */}
                <div className="flex-1 p-4 flex flex-col gap-3.5 overflow-hidden bg-slate-50/40 text-xs">
                  {/* Customer Message */}
                  <div className="flex gap-2.5 max-w-[85%]">
                    <img
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120"
                      alt="Customer"
                      className="h-8 w-8 rounded-full object-cover shrink-0 mt-1 shadow-xs"
                    />
                    <div className="bg-white border border-slate-200/90 rounded-2xl rounded-tl-xs p-3.5 shadow-sm space-y-1.5">
                      <p className="text-slate-800 leading-relaxed font-medium">
                        Chào Hchat! Bên mình có tự động gửi tin nhắn chăm sóc khách hàng và thông báo đơn hàng qua Zalo OA & Messenger được không?
                      </p>
                    </div>
                  </div>

                  {/* AI Chatbot Message */}
                  <div className="flex gap-2.5 max-w-[90%] self-end flex-row-reverse">
                    <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center shrink-0 mt-1 text-white shadow-xs">
                      <BsRobot className="h-4.5 w-4.5" />
                    </div>
                    <div className="bg-blue-100/90 border border-blue-200/90 text-slate-900 rounded-2xl rounded-tr-xs p-4 shadow-xs space-y-2.5">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold">
                        <span className="px-2.5 py-0.5 rounded-full bg-blue-600 text-white flex items-center gap-1.5 font-semibold shadow-xs">
                          <BsStars className="h-3 w-3 text-amber-300" /> Hchat AI Assistant
                        </span>
                      </div>
                      <p className="leading-relaxed text-slate-900 font-semibold">
                        Chào chị Thảo! 👋 Hchat kết nối trực tiếp với <strong>Zalo OA & Facebook Messenger</strong> để tự động hóa gửi thông báo trạng thái đơn hàng tức thì!
                      </p>
                      <div className="bg-white/90 backdrop-blur-xs p-2.5 rounded-xl text-slate-800 text-[11px] border border-blue-200/80 shadow-2xs font-medium">
                        ⚡ AI tự động trả lời thắc mắc 24/7, phân loại khách hàng VIP và báo cáo hiệu suất chốt đơn thời gian thực.
                      </div>

                      <div className="flex flex-wrap gap-2 pt-1">
                        <button className="px-3.5 py-1.5 bg-primary text-white font-bold text-[11px] rounded-xl shadow-xs hover:bg-primary-hover transition-all flex items-center gap-1.5 cursor-pointer">
                          <BsStars className="h-3.5 w-3.5" />
                          <span>Dùng thử tính năng AI Chatbot</span>
                        </button>
                        <button className="px-3.5 py-1.5 bg-white text-slate-800 font-bold text-[11px] rounded-xl border border-slate-200/80 hover:bg-slate-50 transition-colors flex items-center gap-1.5 cursor-pointer">
                          <BsFileTextFill className="h-3.5 w-3.5 text-slate-500" />
                          <span>Xem kịch bản mẫu</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mock Input Bar */}
                <div className="p-3 border-t border-slate-100 bg-white flex items-center gap-2">
                  <div className="flex-1 h-9.5 rounded-xl bg-slate-100/90 px-3.5 flex items-center text-xs text-slate-400 border border-slate-200/60">
                    <span>Nhập câu trả lời hoặc gõ / để chọn mẫu tin...</span>
                  </div>
                  <div className="h-9.5 px-4.5 rounded-xl bg-primary text-white text-xs font-bold flex items-center gap-2 shadow-md hover:bg-primary-hover transition-colors cursor-pointer">
                    <span>Gửi</span>
                    <BsSendFill className="h-3.5 w-3.5" />
                  </div>
                </div>
              </div>

              {/* Customer Detail Sidebar */}
              <div className="w-52 border-l border-slate-200/80 bg-slate-50/60 p-3.5 hidden md:flex flex-col gap-3.5 shrink-0 text-xs">
                <div className="text-center pb-3 border-b border-slate-200/80">
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120"
                    alt="Phương Thảo"
                    className="h-13 w-13 rounded-full object-cover mx-auto mb-2 ring-2 ring-white shadow-sm"
                  />
                  <div className="font-bold text-slate-900">Phương Thảo</div>
                  <div className="text-[10px] text-slate-400 font-medium">Nguồn: Quảng cáo FB</div>
                </div>
                <div className="space-y-2">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Chi tiết khách hàng</div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200/80 text-[11px] space-y-2 text-slate-600 shadow-2xs">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">📞</span>
                      <span className="font-semibold text-slate-800">0987.345.xxx</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">📍</span>
                      <span>Quận 1, TP. Hồ Chí Minh</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-emerald-600 font-bold pt-1.5 border-t border-slate-100">
                      <BsCheckCircleFill className="h-4 w-4" />
                      <span>Đã mua 3 đơn thành công</span>
                    </div>
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
