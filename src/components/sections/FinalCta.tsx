import { Section } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";

export function FinalCta() {
  return (
    <Section className="bg-slate-50 text-slate-900 overflow-hidden relative">
      {/* Abstract background shapes */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-blue-100/50 blur-[80px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[400px] h-[400px] rounded-full bg-cyan-100/40 blur-[100px] pointer-events-none" />
      
      <div className="relative z-10 flex flex-col items-center text-center max-w-3xl mx-auto py-12 md:py-20">
        <h2 className="text-3xl md:text-5xl lg:text-6xl font-extrabold tracking-tighter mb-6">
          Sẵn sàng tăng doanh số với <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0866FF] to-[#00C6FF]">OmniChat?</span>
        </h2>
        <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl leading-relaxed">
          Tham gia cùng 10.000+ doanh nghiệp đang tăng trưởng với OmniChat. Bắt đầu miễn phí ngay hôm nay, không cần thẻ tín dụng.
        </p>
        <Button 
          size="lg" 
          variant="primary"
          className="h-14 px-10 text-lg shadow-[0_8px_20px_-6px_rgba(8,102,255,0.4)]"
        >
          Bắt đầu miễn phí ngay
        </Button>
      </div>
    </Section>
  );
}
