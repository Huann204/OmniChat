import type { ComponentType, SVGProps } from "react";

interface SettingsPlaceholderProps {
  title: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
}

// Dùng cho các mục sidebar chưa xây UI thật — chỉ "Hỗ trợ trả lời" hiện có
// trang đầy đủ (xem app/settings/reply-support/page.tsx), còn lại giữ chỗ để
// sidebar không dẫn tới trang 404.
export function SettingsPlaceholder({ title, icon: Icon }: SettingsPlaceholderProps) {
  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-slate-900">{title}</h1>
      <div className="flex h-[calc(100vh-148px)] flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200/70 bg-white px-4 py-16 text-center shadow-[8px]">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Icon className="h-6 w-6" />
        </span>
        <p className="text-sm font-medium text-slate-600">Tính năng đang được phát triển</p>
      </div>
    </div>
  );
}
