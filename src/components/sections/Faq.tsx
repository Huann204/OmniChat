import { Section } from "@/components/ui/Section";
import { Accordion } from "@/components/ui/Accordion";

export function Faq() {
  const faqItems = [
    {
      title: "OmniChat có hỗ trợ Zalo OA không?",
      content: "Có, OmniChat tích hợp toàn diện với Zalo OA và Zalo Personal (thông qua Zalo Web), giúp bạn quản lý tất cả tin nhắn Zalo trong cùng một giao diện."
    },
    {
      title: "Tôi có thể dùng thử miễn phí không?",
      content: "Chúng tôi cung cấp gói dùng thử 14 ngày miễn phí với đầy đủ các tính năng cao cấp. Bạn không cần nhập thẻ tín dụng để bắt đầu."
    },
    {
      title: "OmniChat có hỗ trợ AI chatbot không?",
      content: "Có, OmniChat tích hợp sâu với GPT-4. Bạn có thể tải lên tài liệu PDF, nhập link website để huấn luyện AI tự động trả lời câu hỏi của khách hàng một cách tự nhiên nhất."
    },
    {
      title: "Có thể gửi broadcast hàng loạt không?",
      content: "Chắc chắn. Tính năng Broadcast của OmniChat cho phép bạn gửi tin nhắn tiếp thị hàng loạt đến khách hàng cũ trên Facebook Messenger và Zalo với kịch bản được cá nhân hóa."
    },
    {
      title: "Dữ liệu có an toàn không?",
      content: "Dữ liệu của bạn được mã hóa và lưu trữ an toàn trên hệ thống máy chủ AWS theo chuẩn bảo mật quốc tế. Chúng tôi cam kết không chia sẻ dữ liệu cho bên thứ ba."
    },
    {
      title: "Tích hợp với CRM hiện tại của tôi được không?",
      content: "OmniChat cung cấp Webhook và API mở, đồng thời tích hợp sẵn với nhiều CRM phổ biến tại Việt Nam như Salekit, KiotViet, Getfly, Nhanh.vn."
    }
  ];

  return (
    <Section id="faq">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 mb-4">
            Câu hỏi thường gặp
          </h2>
          <p className="text-lg text-slate-600">
            Giải đáp những thắc mắc chung nhất về dịch vụ của chúng tôi.
          </p>
        </div>
        
        <Accordion items={faqItems} className="bg-transparent border-none shadow-none p-0" />
      </div>
    </Section>
  );
}
