import { Section } from "@/components/ui/Section";
import { FadeIn } from "@/components/ui/FadeIn";

export function Partners() {
  const partners = [
    "KiotViet", 
    "HubSpot", 
    "Getfly", 
    "Zapier", 
    "Vietiso", 
    "GetResponse"
  ];

  return (
    <Section className="border-t border-slate-100 bg-slate-50/50">
      <div className="text-center max-w-2xl mx-auto mb-12 flex flex-col items-center">
        <FadeIn delay={0.1}>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 mb-4 text-center">
            Tích hợp với hệ sinh thái CRM & công cụ bạn đang dùng
          </h2>
        </FadeIn>
        <FadeIn delay={0.2}>
          <p className="text-slate-600 text-center">
            Đồng bộ dữ liệu khách hàng tự động, giúp quy trình làm việc liền mạch hơn.
          </p>
        </FadeIn>
      </div>

      <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-8 md:gap-x-16 max-w-5xl mx-auto">
        {partners.map((partner, index) => (
          <FadeIn key={index} delay={0.1 * (index % 4)}>
            <div 
              className="text-2xl md:text-3xl font-extrabold text-slate-300 hover:text-slate-800 transition-colors duration-300 grayscale hover:grayscale-0 cursor-pointer"
            >
              {partner}
            </div>
          </FadeIn>
        ))}
      </div>
    </Section>
  );
}
