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
      if (url.pathname.startsWith("/livechat")) return;

      setNavigating(true);
    }

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [setNavigating]);

  return null;
}

export function LoadingBar() {
  return null;
}
