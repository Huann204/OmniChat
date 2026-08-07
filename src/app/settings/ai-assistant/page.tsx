"use client";

import * as React from "react";
import { ChevronDown, Info, Lightbulb, Smile, Sparkles, Wallet, X } from "lucide-react";
import { Switch } from "@/components/ui/Switch";
import { CustomizeAiRepliesModal } from "@/components/settings/CustomizeAiRepliesModal";

// Chỉ là UI tĩnh (chưa nối logic/backend thật) — state chỉ sống trong trang,
// mất khi F5, dùng để demo đúng bố cục + tương tác cơ bản (đổi được lựa
// chọn/tắt-mở) như bản Pancake tham khảo.

function PillSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none rounded-full border border-slate-200 bg-white py-1.5 pl-3.5 pr-8 text-sm font-medium text-slate-700 transition-colors cursor-pointer hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/40"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
    </div>
  );
}

interface SettingRowProps {
  icon: React.ReactNode;
  title: string;
  description: React.ReactNode;
  control?: React.ReactNode;
  children?: React.ReactNode;
}

function SettingRow({ icon, title, description, control, children }: SettingRowProps) {
  return (
    <div className="flex flex-col gap-4 px-6 py-5">
      <div className="flex items-start justify-between gap-6">
        <div className="flex min-w-0 gap-3">
          <span className="mt-0.5 shrink-0">{icon}</span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900">{title}</p>
            <p className="mt-0.5 text-sm leading-relaxed text-slate-500">{description}</p>
          </div>
        </div>
        {control && <div className="flex shrink-0 items-center gap-3">{control}</div>}
      </div>
      {children}
    </div>
  );
}

function SubRow({
  label,
  hint,
  control,
}: {
  label: React.ReactNode;
  hint?: string;
  control: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 pl-11">
      <span className="flex min-w-0 items-center gap-1.5 text-sm text-slate-600">
        {label}
        {hint && (
          <span title={hint} className="text-slate-300">
            <Info className="h-3.5 w-3.5" />
          </span>
        )}
      </span>
      <div className="shrink-0">{control}</div>
    </div>
  );
}

export default function AiAssistantSettingsPage() {
  const [aiModel, setAiModel] = React.useState("Thông minh nhất");
  const [aiModelEnabled, setAiModelEnabled] = React.useState(true);

  const [wallet, setWallet] = React.useState("Test WA   $62.18");

  const [suggestTiming, setSuggestTiming] = React.useState("Khi mở hội thoại");
  const [suggestEnabled, setSuggestEnabled] = React.useState(true);
  const [trainFromSampleEnabled, setTrainFromSampleEnabled] = React.useState(true);

  const [sentimentScope, setSentimentScope] = React.useState("3 tin gần nhất");
  const [sentimentEnabled, setSentimentEnabled] = React.useState(true);
  const [sentimentAction, setSentimentAction] = React.useState("Gắn thẻ hội thoại");
  const [sentimentTags, setSentimentTags] = React.useState(["AI Sentiment"]);

  const [customizeModalOpen, setCustomizeModalOpen] = React.useState(false);

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-slate-900">Trợ lý AI</h1>

      <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-[8px]">
        <SettingRow
          icon={
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-violet-500">
              <Sparkles className="h-4 w-4" />
            </span>
          }
          title="Mô hình AI"
          description="Pancake cung cấp 3 tuỳ chọn AI khác nhau. Model thông minh nhất, chi phí sẽ cao hơn nhưng chất lượng sẽ tốt nhất."
          control={
            <>
              <PillSelect
                value={aiModel}
                onChange={setAiModel}
                options={["Thông minh nhất", "Cân bằng", "Tiết kiệm"]}
              />
              <Switch checked={aiModelEnabled} onCheckedChange={setAiModelEnabled} aria-label="Bật/tắt mô hình AI" />
            </>
          }
        />

        <SettingRow
          icon={
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-500">
              <Wallet className="h-4 w-4" />
            </span>
          }
          title="Thanh toán"
          description="Phí sử dụng tính năng AI sẽ được trừ trực tiếp từ ví Pancake bạn chọn. Hãy nạp tiền vào ví để đảm bảo dịch vụ không bị gián đoạn."
          control={
            <>
              <button
                type="button"
                className="text-sm font-semibold text-primary transition-colors hover:text-primary-hover cursor-pointer"
              >
                Nạp tiền
              </button>
              <PillSelect value={wallet} onChange={setWallet} options={["Test WA   $62.18"]} />
            </>
          }
        />

        <SettingRow
          icon={
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-500">
              <Lightbulb className="h-4 w-4" />
            </span>
          }
          title="Gợi ý trả lời tin nhắn từ AI"
          description={
            <>
              Tự động hiển thị <span className="font-semibold text-slate-700">3 câu gợi ý</span> trả
              lời tin nhắn dựa trên nội dung cuộc trò chuyện gần nhất giúp bạn phản hồi nhanh hơn.
            </>
          }
          control={
            <>
              <PillSelect
                value={suggestTiming}
                onChange={setSuggestTiming}
                options={["Khi mở hội thoại", "Luôn hiển thị"]}
              />
              <Switch checked={suggestEnabled} onCheckedChange={setSuggestEnabled} aria-label="Bật/tắt gợi ý trả lời" />
            </>
          }
        >
          {/* <SubRow
            label="Cho phép chọn hội thoại điển hình để đào tạo AI"
            hint="Dùng các hội thoại bạn đánh dấu làm mẫu để AI trả lời sát phong cách của Shop hơn."
            control={
              <Switch
                checked={trainFromSampleEnabled}
                onCheckedChange={setTrainFromSampleEnabled}
                aria-label="Bật/tắt đào tạo AI từ hội thoại điển hình"
              />
            }
          /> */}
          <SubRow
            label="Thêm yêu cầu nâng cao cho những gợi ý trả lời từ AI"
            control={
              <button
                type="button"
                onClick={() => setCustomizeModalOpen(true)}
                className="text-sm font-semibold text-primary transition-colors hover:text-primary-hover cursor-pointer"
              >
                Tuỳ chỉnh
              </button>
            }
          />
        </SettingRow>

        <SettingRow
          icon={
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-500">
              <Smile className="h-4 w-4" />
            </span>
          }
          title="Phát hiện cảm xúc của khách hàng"
          description="Tự động phân tích và hiển thị sắc thái cảm xúc khách hàng trong cuộc trò chuyện. Tăng độ chính xác bằng cách cho AI truy cập nhiều tin nhắn cũ hơn."
          control={
            <>
              <PillSelect
                value={sentimentScope}
                onChange={setSentimentScope}
                options={["3 tin gần nhất", "5 tin gần nhất", "10 tin gần nhất"]}
              />
              <Switch checked={sentimentEnabled} onCheckedChange={setSentimentEnabled} aria-label="Bật/tắt phát hiện cảm xúc" />
            </>
          }
        >
          <div className="pl-11">
            <p className="text-sm text-slate-600">
              Khi khách hàng <span className="font-semibold text-slate-800">Không hài lòng</span>{" "}
              hoặc <span className="font-semibold text-slate-800">giận dữ, tiêu cực</span>:
            </p>
          </div>

          <SubRow
            label="Khi phát hiện, tự động"
            control={
              <PillSelect
                value={sentimentAction}
                onChange={setSentimentAction}
                options={["Gắn thẻ hội thoại", "Gửi thông báo", "Không làm gì"]}
              />
            }
          />

          {sentimentAction === "Gắn thẻ hội thoại" && (
            <div className="pl-11">
              <div className="flex min-h-10 flex-wrap items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                {sentimentTags.map((tag) => (
                  <span
                    key={tag}
                    className="flex items-center gap-1 rounded-md bg-sky-100 px-2 py-1 text-xs font-semibold text-sky-700"
                  >
                    {tag}
                    <button
                      type="button"
                      aria-label={`Bỏ thẻ ${tag}`}
                      onClick={() => setSentimentTags((prev) => prev.filter((t) => t !== tag))}
                      className="text-sky-500 transition-colors hover:text-sky-700 cursor-pointer"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                {sentimentTags.length === 0 && (
                  <span className="text-sm text-slate-400">Chưa chọn thẻ nào</span>
                )}
              </div>
            </div>
          )}
        </SettingRow>
      </div>

      <CustomizeAiRepliesModal
        open={customizeModalOpen}
        onClose={() => setCustomizeModalOpen(false)}
      />
    </div>
  );
}
