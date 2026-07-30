import { Section } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";
import { Star } from "lucide-react";

export function Testimonials() {
  const testimonials = [
    {
      name: "Nguyễn Văn A",
      role: "CEO",
      company: "Thời trang X",
      content: "Nhờ OmniChat, chúng tôi tiết kiệm được 40% thời gian trực page và tăng 25% tỷ lệ chốt đơn nhờ tính năng gửi tin nhắn hàng loạt.",
      avatar: "A"
    },
    {
      name: "Trần Thị B",
      role: "Marketing Manager",
      company: "Spa Y",
      content: "AI Chatbot của OmniChat thực sự thông minh. Khách hàng đặt lịch tự động mà không cần nhân viên can thiệp vào nửa đêm.",
      avatar: "B"
    },
    {
      name: "Lê Văn C",
      role: "Founder",
      company: "Giáo dục Z",
      content: "Quản lý nhiều kênh Zalo và Facebook trên cùng một màn hình giúp tôi không bị lỡ bất kỳ tin nhắn nào của phụ huynh.",
      avatar: "C"
    }
  ];

  return (
    <Section className="bg-slate-50">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 mb-4">
          Doanh nghiệp nói gì về OmniChat
        </h2>
        <p className="text-lg text-slate-600">
          Hàng ngàn doanh nghiệp đã chuyển đổi số thành công cùng OmniChat.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        {testimonials.map((item, index) => (
          <Card key={index} className="p-8">
            <div className="flex items-center gap-1 mb-6 text-[#F59E0B]">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} className="h-5 w-5 fill-current" />
              ))}
            </div>
            <p className="text-slate-700 italic mb-8 leading-relaxed">
              "{item.content}"
            </p>
            <div className="flex items-center gap-4 mt-auto">
              <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
                {item.avatar}
              </div>
              <div>
                <h4 className="font-semibold text-slate-900">{item.name}</h4>
                <p className="text-sm text-slate-500">{item.role}, {item.company}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-8 border-t border-slate-200">
        <div className="text-center">
          <div className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-2">10.000+</div>
          <div className="text-sm font-medium text-slate-500 uppercase tracking-wider">Doanh nghiệp</div>
        </div>
        <div className="text-center">
          <div className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-2">50M+</div>
          <div className="text-sm font-medium text-slate-500 uppercase tracking-wider">Tin nhắn/tháng</div>
        </div>
        <div className="text-center">
          <div className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-2">98%</div>
          <div className="text-sm font-medium text-slate-500 uppercase tracking-wider">Hài lòng</div>
        </div>
        <div className="text-center">
          <div className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-2">8</div>
          <div className="text-sm font-medium text-slate-500 uppercase tracking-wider">Kênh tích hợp</div>
        </div>
      </div>
    </Section>
  );
}
