"use client";

import * as React from "react";
import Link from "next/link";
import { Section } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FadeIn } from "@/components/ui/FadeIn";
import { BsCheckLg } from "react-icons/bs";
import { cn } from "@/lib/utils";

export function Pricing() {
  const [isAnnual, setIsAnnual] = React.useState(false);

  const plans = [
    {
      name: "STARTER",
      priceMonthly: "Miễn phí",
      priceAnnual: "Miễn phí",
      description: "Dành cho cá nhân mới bắt đầu kinh doanh.",
      features: [
        "10 Pages",
        "150 AI Credit/tháng",
        "0 Nhân viên (Chỉ chủ shop)",
        "Chatbot cơ bản",
      ],
      isPopular: false,
    },
    {
      name: "LIVECHAT",
      priceMonthly: "149.000đ",
      priceAnnual: "119.000đ",
      description: "Tập trung quản lý tin nhắn đa kênh.",
      features: [
        "1 Page",
        "Không có AI Credit",
        "2 Nhân viên",
        "Hộp thư hợp nhất",
      ],
      isPopular: false,
    },
    {
      name: "CHATBOT",
      priceMonthly: "399.000đ",
      priceAnnual: "299.000đ",
      description: "Dành cho cửa hàng cần tự động hóa.",
      features: [
        "2 Pages",
        "300 AI Credit/tháng",
        "3 Nhân viên",
        "Flow Chatbot kéo thả",
        "MiniGame & Vòng quay",
      ],
      isPopular: false,
    },
    {
      name: "BUSINESS",
      priceMonthly: "1.399.000đ",
      priceAnnual: "999.000đ",
      description: "Giải pháp toàn diện cho doanh nghiệp SME.",
      features: [
        "5 Pages",
        "500 AI Credit/tháng",
        "5 Nhân viên",
        "Full tính năng Chatbot",
        "Tích hợp API/CRM",
        "Hỗ trợ 1-1 24/7",
      ],
      isPopular: true,
    },
  ];

  return (
    <Section id="pricing" className="bg-slate-50">
      <div className="text-center max-w-3xl mx-auto mb-12">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 mb-4">
          Gói dịch vụ phù hợp với mọi quy mô
        </h2>
        <p className="text-lg text-slate-600 mb-8">
          Dùng thử 14 ngày miễn phí tất cả gói. Không cần thẻ tín dụng.
        </p>

        {/* Toggle Billing */}
        <div className="flex items-center justify-center gap-3">
          <span className={cn("text-sm font-medium", !isAnnual ? "text-slate-900" : "text-slate-500")}>
            Thanh toán Tháng
          </span>
          <button
            onClick={() => setIsAnnual(!isAnnual)}
            className="relative inline-flex h-7 w-14 items-center rounded-full bg-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            <span
              className={cn(
                "inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-200 ease-in-out",
                isAnnual ? "translate-x-8" : "translate-x-1"
              )}
            />
          </button>
          <div className="flex items-center gap-2">
            <span className={cn("text-sm font-medium", isAnnual ? "text-slate-900" : "text-slate-500")}>
              Thanh toán Năm
            </span>
            <span className="inline-block rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
              Giảm ~25%
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto mt-12">
        {plans.map((plan, index) => (
          <FadeIn key={plan.name} delay={0.1 * (index + 1)} className="h-full flex">
            <Card 
              className={cn(
                "relative flex flex-col p-8 transition-all duration-300 w-full",
                plan.isPopular ? "border-primary shadow-xl scale-100 lg:scale-105 z-10 bg-white" : "border-slate-200/60 bg-white/80"
              )}
            >
              {plan.isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#0866FF] to-[#00C6FF] text-white text-xs font-bold uppercase tracking-wider py-1.5 px-4 rounded-full shadow-md">
                  Phổ biến nhất
                </div>
              )}
              
              <div className="mb-6">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-3">
                  {plan.name}
                </h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
                    {isAnnual ? plan.priceAnnual : plan.priceMonthly}
                  </span>
                  {plan.priceMonthly !== "Miễn phí" && (
                    <span className="text-slate-500 font-medium">/tháng</span>
                  )}
                </div>
                <p className="text-sm text-slate-500 mt-4 h-10 leading-relaxed">
                  {plan.description}
                </p>
              </div>

              <Link href={`/register?plan=${plan.name.toLowerCase()}`} className="w-full mb-8">
                <Button 
                  variant={plan.isPopular ? "primary" : "outline"} 
                  className="w-full h-12 text-base"
                >
                  Chọn gói
                </Button>
              </Link>

              <div className="flex-1 border-t border-slate-100 pt-6">
                <p className="text-sm font-semibold text-slate-900 mb-4 uppercase tracking-wider">Bao gồm:</p>
                <ul className="space-y-4">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <BsCheckLg className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-600 font-medium">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          </FadeIn>
        ))}
      </div>
    </Section>
  );
}
