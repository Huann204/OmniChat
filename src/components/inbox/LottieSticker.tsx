"use client";

import * as React from "react";
import { ungzip } from "pako";
import { Lottie } from "lottie-react";
import { cn } from "@/lib/utils";

// Sticker Lottie Telegram (.tgs) — file JSON animation đã nén gzip, KHÁC hẳn
// sticker tĩnh (webp)/GIF vốn render thẳng qua <img>/<video> được. Phải tự
// tải file gốc về, giải nén (pako) rồi mới có JSON hợp lệ đưa cho lottie-react
// render — không nhúng thẳng url như ảnh/video khác được.
export function LottieSticker({ url, className }: { url: string; className?: string }) {
  const [animationData, setAnimationData] = React.useState<object | null>(null);
  const [failed, setFailed] = React.useState(false);

  // Đổi url thì reset trạng thái — setState thường ngay trong thân render
  // (an toàn, mirror MediaPickerModal.tsx), KHÔNG đặt trong effect (tránh lỗi
  // react-hooks/set-state-in-effect vì gọi setState đồng bộ ngay đầu effect).
  const [prevUrl, setPrevUrl] = React.useState(url);
  if (url !== prevUrl) {
    setPrevUrl(url);
    setAnimationData(null);
    setFailed(false);
  }

  React.useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const buffer = await res.arrayBuffer();
        const json = ungzip(new Uint8Array(buffer), { toText: true });
        const data = JSON.parse(json) as object;
        if (!cancelled) setAnimationData(data);
      } catch (err) {
        console.error(`Không hiện được sticker Lottie (${url}):`, err);
        if (!cancelled) setFailed(true);
      }
    }
    void run();

    return () => {
      cancelled = true;
    };
  }, [url]);

  if (failed) {
    // Lottie lỗi (file hỏng, hoặc trình duyệt không tải được) — vẫn cho bấm
    // mở file gốc thay vì hiện trống trơn, giống cách file/video khác xử lý.
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={cn("flex h-24 w-24 items-center justify-center text-xs text-slate-400 underline", className)}
      >
        Xem nhãn dán
      </a>
    );
  }

  if (!animationData) {
    return <div className={cn("h-24 w-24 animate-pulse rounded-xl bg-slate-100", className)} />;
  }

  return (
    <Lottie
      src={animationData}
      loop
      autoplay
      className={cn("h-24 w-24", className)}
      // Sticker Telegram thường có kích thước gốc lớn (vd 512x512) — renderer
      // SVG của lottie-web tự đặt width/height NGAY TRÊN thẻ <svg>, thắng cả
      // class Tailwind (CSS thường) nếu chỉ dựa vào className. Ép cứng bằng
      // style (inline, luôn thắng specificity) để chắc chắn co về đúng 96px
      // dù animation gốc to cỡ nào.
      style={{ width: 96, height: 96 }}
    />
  );
}
