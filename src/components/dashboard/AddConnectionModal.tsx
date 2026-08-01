"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, Clock, KeyRound, Layers3, Loader2, Search, SlidersHorizontal } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { CONNECTION_PLATFORMS } from "@/lib/connection-platforms";
import { cn } from "@/lib/utils";
import { toast } from "@/store/toast-store";
import { loginWithFacebook } from "@/lib/facebook-sdk";
import {
  connectFacebookPage,
  listFacebookPages,
  type FacebookPageOption,
} from "@/app/actions/facebook";

interface AddConnectionModalProps {
  open: boolean;
  onClose: () => void;
}

const PENDING_KEY = "pending";

export function AddConnectionModal({ open, onClose }: AddConnectionModalProps) {
  const [selectedKey, setSelectedKey] = React.useState(CONNECTION_PLATFORMS[0].key);
  const selected = CONNECTION_PLATFORMS.find((p) => p.key === selectedKey);
  const isPending = selectedKey === PENDING_KEY;

  function handleConnect() {
    if (!selected) return;
    toast.info(`Đang chuyển đến ${selected.label} để xác thực...`);
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Thêm kết nối" className="max-w-4xl">
      <div className="flex min-h-[440px]">
        <div className="w-56 shrink-0 overflow-y-auto border-r border-slate-200 py-2">
          <button
            type="button"
            onClick={() => setSelectedKey(PENDING_KEY)}
            className={cn(
              "flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left text-sm font-medium transition-colors",
              isPending ? "bg-slate-100 text-slate-900" : "text-slate-600 hover:bg-slate-50"
            )}
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-400">
              <Clock className="h-3.5 w-3.5 text-white" />
            </span>
            <span className="flex-1 truncate">Chờ kích hoạt</span>
          </button>

          {CONNECTION_PLATFORMS.map((platform) => {
            const PlatformIcon = platform.icon;
            const active = platform.key === selectedKey;
            return (
              <button
                key={platform.key}
                type="button"
                onClick={() => setSelectedKey(platform.key)}
                className={cn(
                  "flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left text-sm font-medium transition-colors",
                  active ? "bg-slate-100 text-slate-900" : "text-slate-600 hover:bg-slate-50"
                )}
              >
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                  style={{ background: platform.badgeBg }}
                >
                  <PlatformIcon className="h-3.5 w-3.5 text-white" />
                </span>
                <span className="flex-1 truncate">{platform.label}</span>
                {platform.beta && (
                  <span className="shrink-0 rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">
                    Beta
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {isPending ? (
          <PendingActivationPanel />
        ) : selected?.key === "facebook" ? (
          <FacebookConnectPanel selected={selected} onClose={onClose} />
        ) : selected ? (
          <ConnectPlatformPanel selected={selected} onConnect={handleConnect} />
        ) : null}
      </div>
    </Modal>
  );
}

type FacebookStep = "idle" | "loading" | "picking" | "connecting";

function FacebookConnectPanel({
  selected,
  onClose,
}: {
  selected: (typeof CONNECTION_PLATFORMS)[number];
  onClose: () => void;
}) {
  const router = useRouter();
  const SelectedIcon = selected.icon;
  const [step, setStep] = React.useState<FacebookStep>("idle");
  const [pages, setPages] = React.useState<FacebookPageOption[]>([]);
  const [selectedPageId, setSelectedPageId] = React.useState<string | null>(null);

  async function handleStartLogin() {
    setStep("loading");
    try {
      const userAccessToken = await loginWithFacebook();
      const { pages: fetchedPages, error } = await listFacebookPages(userAccessToken);

      if (error) {
        toast.error(error);
        setStep("idle");
        return;
      }
      if (!fetchedPages || fetchedPages.length === 0) {
        toast.info("Tài khoản Facebook của bạn chưa quản lý Page nào.");
        setStep("idle");
        return;
      }

      setPages(fetchedPages);
      setStep("picking");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Kết nối Facebook thất bại");
      setStep("idle");
    }
  }

  async function handleConfirmPage() {
    if (!selectedPageId) return;
    setStep("connecting");

    const { page, error } = await connectFacebookPage(selectedPageId);

    if (error) {
      toast.error(error);
      setStep("picking");
      return;
    }

    toast.success(`Đã kết nối Page "${page?.name}" thành công`);
    onClose();
    // Danh sách bot ở dashboard được lấy server-side (getConnectedPages);
    // router.refresh() để tải lại ngay, không cần user tự F5.
    router.refresh();
  }

  if (step === "picking" || step === "connecting") {
    return (
      <div className="flex flex-1 flex-col">
        <div className="shrink-0 border-b border-slate-200 px-6 py-3.5">
          <p className="text-sm font-semibold text-slate-900">Chọn Page để kết nối</p>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3">
          <div className="space-y-1.5">
            {pages.map((page) => {
              const active = page.pageId === selectedPageId;
              return (
                <button
                  key={page.pageId}
                  type="button"
                  onClick={() => setSelectedPageId(page.pageId)}
                  className={cn(
                    "flex w-full cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors",
                    active
                      ? "border-primary bg-primary/5"
                      : "border-slate-200 hover:bg-slate-50"
                  )}
                >
                  {page.pictureUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={page.pictureUrl}
                      alt={page.pageName}
                      className="h-9 w-9 shrink-0 rounded-lg object-cover"
                    />
                  ) : (
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#0866FF] text-sm font-bold text-white">
                      {page.pageName.charAt(0).toUpperCase()}
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-slate-900">
                      {page.pageName}
                    </span>
                    {page.category && (
                      <span className="block truncate text-xs text-slate-400">
                        {page.category}
                      </span>
                    )}
                  </span>
                  {active && <Check className="h-4 w-4 shrink-0 text-primary" />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-slate-200 px-6 py-3.5">
          <button
            type="button"
            onClick={() => setStep("idle")}
            disabled={step === "connecting"}
            className="cursor-pointer rounded-lg px-3.5 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Quay lại
          </button>
          <button
            type="button"
            onClick={handleConfirmPage}
            disabled={!selectedPageId || step === "connecting"}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {step === "connecting" && <Loader2 className="h-4 w-4 animate-spin" />}
            Kết nối Page này
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="shrink-0 border-b border-slate-200 px-6 py-3.5">
        <p className="text-sm font-semibold text-slate-900">
          Thêm tài khoản {selected.label}
        </p>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 py-10 text-center">
        <div className="flex items-center gap-2">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-r from-primary to-primary-gradient text-sm font-bold text-white">
            C
          </span>
          <span className="h-[1px] w-6 bg-slate-300" />
          <span
            className="flex h-11 w-11 items-center justify-center rounded-full"
            style={{ background: selected.badgeBg }}
          >
            <SelectedIcon className="h-5 w-5 text-white" />
          </span>
        </div>

        <h3 className="text-lg font-semibold text-slate-900">
          Kết nối với {selected.label}
        </h3>
        <p className="max-w-md text-sm text-slate-500">{selected.description}</p>

        <button
          type="button"
          onClick={handleStartLogin}
          disabled={step === "loading"}
          className="mt-2 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {step === "loading" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <SelectedIcon className="h-4 w-4" style={{ color: selected.accent }} />
          )}
          Kết nối với {selected.label}
        </button>
      </div>
    </div>
  );
}

function ConnectPlatformPanel({
  selected,
  onConnect,
}: {
  selected: (typeof CONNECTION_PLATFORMS)[number];
  onConnect: () => void;
}) {
  const SelectedIcon = selected.icon;

  return (
    <div className="flex flex-1 flex-col">
      <div className="shrink-0 border-b border-slate-200 px-6 py-3.5">
        <p className="text-sm font-semibold text-slate-900">
          Thêm tài khoản {selected.label}
        </p>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 py-10 text-center">
        <div className="flex items-center gap-2">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-r from-primary to-primary-gradient text-sm font-bold text-white">
            C
          </span>
          <span className="h-[1px] w-6 bg-slate-300" />
          <span
            className="flex h-11 w-11 items-center justify-center rounded-full"
            style={{ background: selected.badgeBg }}
          >
            <SelectedIcon className="h-5 w-5 text-white" />
          </span>
        </div>

        <h3 className="text-lg font-semibold text-slate-900">
          Kết nối với {selected.label}
        </h3>
        <p className="max-w-md text-sm text-slate-500">{selected.description}</p>

        <button
          type="button"
          onClick={onConnect}
          className="mt-2 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
        >
          <SelectedIcon className="h-4 w-4" style={{ color: selected.accent }} />
          Kết nối với {selected.label}
        </button>

        <a href="#" className="text-xs font-medium text-primary hover:underline">
          Hướng dẫn kết nối
        </a>
      </div>
    </div>
  );
}

function PendingActivationPanel() {
  const [tab, setTab] = React.useState<"pending" | "hidden">("pending");
  const [search, setSearch] = React.useState("");

  return (
    <div className="flex flex-1 flex-col">
      <div className="shrink-0 border-b border-slate-200 px-6 py-3.5">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm font-semibold text-slate-900">Chọn trang để kích hoạt</p>
          <div className="relative w-56">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm trang"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-8 text-xs text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-white"
            />
            <SlidersHorizontal className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setTab("pending")}
              className={cn(
                "cursor-pointer border-b-2 pb-2 text-sm font-semibold transition-colors",
                tab === "pending"
                  ? "border-primary text-primary"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              )}
            >
              Chờ kích hoạt
            </button>
            <button
              type="button"
              onClick={() => setTab("hidden")}
              className={cn(
                "cursor-pointer border-b-2 pb-2 text-sm font-semibold transition-colors",
                tab === "hidden"
                  ? "border-primary text-primary"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              )}
            >
              Đã ẩn
            </button>
          </div>
          <button
            type="button"
            className="flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
          >
            <KeyRound className="h-3.5 w-3.5" />
            Mã kết nối
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-2 px-8 py-10 text-center">
        <Layers3 className="h-16 w-16 text-slate-200" strokeWidth={1.2} />
        <h3 className="mt-2 text-base font-semibold text-slate-900">Không có trang nào 😵</h3>
        <p className="max-w-sm text-sm text-slate-500">
          {tab === "pending"
            ? "Bạn chưa có trang nào để kích hoạt. Vui lòng chọn nền tảng và kết nối thêm trang để sử dụng"
            : "Bạn chưa ẩn trang nào."}
        </p>
      </div>
    </div>
  );
}
