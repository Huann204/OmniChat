"use client";

import * as React from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useLoadingBarStore } from "@/store/loading-bar-store";

// Bắt click vào các thẻ <a> nội bộ (kể cả do next/link render ra) để bật
// thanh loading ngay lập tức, không cần chờ Next.js xác nhận điều hướng.
function NavigationWatcher() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const setNavigating = useLoadingBarStore((state) => state.setNavigating);

  React.useEffect(() => {
    setNavigating(false);
  }, [pathname, searchParams, setNavigating]);

  React.useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
        return;
      }
      const anchor = (e.target as HTMLElement)?.closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || anchor.target === "_blank" || anchor.hasAttribute("download")) {
        return;
      }

      let url: URL;
      try {
        url = new URL(href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;

      setNavigating(true);
    }

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [setNavigating]);

  return null;
}

export function LoadingBar() {
  const manual = useLoadingBarStore((state) => state.manual);
  const navigating = useLoadingBarStore((state) => state.navigating);
  const isLoading = manual > 0 || navigating;

  const containerRef = React.useRef<HTMLDivElement>(null);
  const barRef = React.useRef<HTMLDivElement>(null);
  const progressRef = React.useRef(0);

  // Thanh loading là hiệu ứng thuần trang trí, không ảnh hưởng tới nội dung
  // render — nên điều khiển trực tiếp qua DOM ref (thay vì setState) để
  // tránh re-render component mỗi 200ms và tránh setState đồng bộ trong effect.
  React.useEffect(() => {
    const container = containerRef.current;
    const bar = barRef.current;
    if (!container || !bar) return;

    if (isLoading) {
      container.style.opacity = "1";
      progressRef.current = 15;
      bar.style.width = "15%";
      const interval = setInterval(() => {
        progressRef.current =
          progressRef.current >= 90 ? progressRef.current : progressRef.current + (90 - progressRef.current) / 10;
        bar.style.width = `${progressRef.current}%`;
      }, 200);
      return () => clearInterval(interval);
    }

    if (progressRef.current > 0) {
      bar.style.width = "100%";
      const timeout = setTimeout(() => {
        container.style.opacity = "0";
        progressRef.current = 0;
        bar.style.width = "0%";
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [isLoading]);

  return (
    <>
      <React.Suspense fallback={null}>
        <NavigationWatcher />
      </React.Suspense>
      <div
        ref={containerRef}
        aria-hidden
        className="fixed inset-x-0 top-0 z-[110] h-[3px] opacity-0 transition-opacity duration-300"
      >
        <div
          ref={barRef}
          className="h-full w-0 bg-gradient-to-r from-primary to-primary-gradient shadow-[0_0_8px_rgba(8,102,255,0.6)] transition-[width] duration-300 ease-out"
        />
      </div>
    </>
  );
}
