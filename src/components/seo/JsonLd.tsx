import React from "react";

export function JsonLd() {
  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Hchat",
    operatingSystem: "Web, Cloud",
    applicationCategory: "BusinessApplication",
    description:
      "Phần mềm quản lý tin nhắn đa kênh Facebook, Zalo, Instagram, WhatsApp và Website. Tự động hóa chốt đơn với AI Chatbot 24/7.",
    url: "https://hchat.site",
    image: "https://hchat.site/hchat.png",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "VND",
      priceValidUntil: "2030-12-31",
      availability: "https://schema.org/InStock",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      ratingCount: "1250",
      reviewCount: "1250",
      bestRating: "5",
      worstRating: "1",
    },
  };

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Hchat",
    url: "https://hchat.site",
    logo: "https://hchat.site/hchat.png",
    sameAs: [
      "https://facebook.com/hchat",
      "https://zalo.me/hchat",
    ],
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Hchat hỗ trợ kết nối những kênh bán hàng nào?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Hchat hỗ trợ kết nối đồng bộ tin nhắn và bình luận từ Facebook Fanpage, Zalo Official Account, Instagram Direct, WhatsApp Business và Livechat Website trên một màn hình duy nhất.",
        },
      },
      {
        "@type": "Question",
        name: "AI Chatbot trên Hchat có tự động chốt đơn được không?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Có. AI Chatbot của Hchat có khả năng tự động hiểu ý định khách hàng, tư vấn sản phẩm theo kịch bản thông minh, ghi nhận thông tin giao hàng và hỗ trợ chốt đơn 24/7.",
        },
      },
      {
        "@type": "Question",
        name: "Dùng thử Hchat có cần khai báo thẻ tín dụng không?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Hoàn toàn không. Bạn được trải nghiệm 14 ngày dùng thử miễn phí đầy đủ tính năng mà không cần cung cấp bất kỳ thông tin thẻ tín dụng nào.",
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </>
  );
}
