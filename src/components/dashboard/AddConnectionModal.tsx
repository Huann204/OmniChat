"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { io, type Socket } from "socket.io-client";
import {
  BsCheckLg,
  BsFillClockFill,
  BsKeyFill,
  BsFillLayersFill,
  BsArrowRepeat,
  BsSearch,
  BsSliders,
  BsGear,
  BsQrCodeScan,
  BsQuestionCircle,
} from "react-icons/bs";
import { Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { CONNECTION_PLATFORMS } from "@/lib/connection-platforms";
import { cn } from "@/lib/utils";
import { toast } from "@/store/toast-store";
import { loginWithFacebook } from "@/lib/facebook-sdk";
import { getSocketTicket } from "@/app/actions/socket";
import {
  connectFacebookPage,
  listFacebookPages,
  type FacebookPageOption,
} from "@/app/actions/facebook";
import { TelegramConnectPanel } from "./TelegramConnectPanel";

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
        <div className="w-56 shrink-0 overflow-y-auto border-r border-slate-200 p-2 space-y-1">
          <button
            type="button"
            onClick={() => setSelectedKey(PENDING_KEY)}
            className={cn(
              "flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors",
              isPending ? "bg-slate-100 text-slate-900 font-semibold" : "text-slate-700 hover:bg-slate-50"
            )}
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#fbbf24] shadow-xs">
              <BsFillClockFill className="h-4 w-4 text-white" />
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
                  "flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors",
                  active ? "bg-slate-100 text-slate-900 font-semibold" : "text-slate-700 hover:bg-slate-50"
                )}
              >
                {platform.imageSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={platform.imageSrc}
                    alt={platform.label}
                    className="h-8 w-8 shrink-0 rounded-lg object-contain shadow-xs"
                  />
                ) : (
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg shadow-xs"
                    style={{ background: platform.badgeBg }}
                  >
                    <PlatformIcon className="h-4 w-4 text-white" />
                  </span>
                )}
                <span className="flex-1 truncate">{platform.label}</span>
                {platform.beta && (
                  <span className="shrink-0 rounded-full bg-amber-100/90 px-2 py-0.5 text-[11px] font-medium text-amber-800">
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
        ) : selected?.key === "zalo-personal" ? (
          <ZaloConnectPanel selected={selected} onClose={onClose} />
        ) : selected?.key === "telegram" ? (
          <TelegramConnectPanel selected={selected} onClose={onClose} />
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
                  {active && <BsCheckLg className="h-4 w-4 shrink-0 text-primary" />}
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
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/favi.png"
            alt="Hchat Logo"
            className="h-11 w-11 shrink-0 rounded-lg object-contain shadow-xs"
          />
          <span className="h-[1px] w-6 bg-slate-300" />
          {selected.imageSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={selected.imageSrc}
              alt={selected.label}
              className="h-11 w-11 shrink-0 rounded-lg object-contain shadow-xs"
            />
          ) : (
            <span
              className="flex h-11 w-11 items-center justify-center rounded-lg shadow-xs"
              style={{ background: selected.badgeBg }}
            >
              <SelectedIcon className="h-5 w-5 text-white" />
            </span>
          )}
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
          ) : selected.imageSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={selected.imageSrc} alt="" className="h-4 w-4 shrink-0 object-contain" />
          ) : (
            <SelectedIcon className="h-4 w-4" style={{ color: selected.accent }} />
          )}
          Kết nối với {selected.label}
        </button>
      </div>
    </div>
  );
}

interface ZaloLoginQrEvent {
  image: string;
}
interface ZaloLoginScannedEvent {
  displayName: string;
  avatar: string;
}
interface ZaloLoginSuccessEvent {
  page: { id: string; name: string; picture?: string };
}
interface ZaloLoginErrorEvent {
  message: string;
}

type ZaloLoginState =
  | { step: "connecting" }
  | { step: "qr"; image: string; scannedBy?: ZaloLoginScannedEvent }
  | { step: "success" }
  | { step: "error"; message: string };

function ZaloConnectPanel({
  selected,
  onClose,
}: {
  selected: (typeof CONNECTION_PLATFORMS)[number];
  onClose: () => void;
}) {
  const router = useRouter();
  const SelectedIcon = selected.icon;
  const [state, setState] = React.useState<ZaloLoginState>({ step: "connecting" });
  const socketRef = React.useRef<Socket | null>(null);

  const startLogin = React.useCallback(async () => {
    let socket = socketRef.current;
    if (!socket) {
      const ticket = await getSocketTicket();
      if (!ticket) {
        setState({ step: "error", message: "Không tạo được kết nối, vui lòng thử lại" });
        return;
      }

      socket = io(process.env.NEXT_PUBLIC_SOCKET_URL, { auth: { ticket } });
      socketRef.current = socket;

      socket.on("zalo_login_qr", (payload: ZaloLoginQrEvent) => {
        setState({ step: "qr", image: payload.image });
      });
      socket.on("zalo_login_scanned", (payload: ZaloLoginScannedEvent) => {
        setState((prev) =>
          prev.step === "qr" ? { ...prev, scannedBy: payload } : prev
        );
      });
      socket.on("zalo_login_success", (payload: ZaloLoginSuccessEvent) => {
        setState({ step: "success" });
        toast.success(`Đã kết nối Zalo "${payload.page.name}" thành công`);
        onClose();
        router.refresh();
      });
      socket.on("zalo_login_declined", () => {
        setState({ step: "error", message: "Đã từ chối đăng nhập trên điện thoại" });
      });
      socket.on("zalo_login_expired", () => {
        setState({ step: "error", message: "Mã QR đã hết hạn" });
      });
      socket.on("zalo_login_error", (payload: ZaloLoginErrorEvent) => {
        setState({ step: "error", message: payload.message });
      });
      socket.on("connect", () => socket?.emit("start_zalo_login"));
    } else {
      socket.emit("start_zalo_login");
    }
  }, [onClose, router]);

  React.useEffect(() => {
    (async () => {
      await startLogin();
    })();
    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-1 flex-col">
      <div className="shrink-0 border-b border-slate-200 px-6 py-3.5">
        <p className="text-sm font-semibold text-slate-900">
          Thêm tài khoản {selected.label}
        </p>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center p-6 md:p-8">
        {(state.step === "connecting" || state.step === "qr") && (
          <div className="w-full max-w-2xl">
            {state.step === "qr" && state.scannedBy && (
              <div className="mb-6 flex items-center gap-2 rounded-xl bg-blue-50/80 border border-blue-200/80 px-4 py-3 text-sm text-blue-800">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600 shrink-0" />
                <span>
                  Đã quét bởi <strong>{state.scannedBy.displayName}</strong> — vui lòng xác nhận đăng nhập trên điện thoại
                </span>
              </div>
            )}

            <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
              {/* Mã QR với khung định vị 4 góc màu xanh (Viewfinder frame) */}
              <div className="relative p-2 flex items-center justify-center shrink-0">
                {/* 4 góc viền xanh ôm sát QR */}
                <div className="absolute top-0 left-0 h-5 w-5 border-t-[2.5px] border-l-[2.5px] border-[#0068FF] rounded-tl-lg" />
                <div className="absolute top-0 right-0 h-5 w-5 border-t-[2.5px] border-r-[2.5px] border-[#0068FF] rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 h-5 w-5 border-b-[2.5px] border-l-[2.5px] border-[#0068FF] rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 h-5 w-5 border-b-[2.5px] border-r-[2.5px] border-[#0068FF] rounded-br-lg" />

                {state.step === "connecting" ? (
                  <div className="flex h-48 w-48 sm:h-52 sm:w-52 items-center justify-center rounded-md bg-slate-50/50">
                    <Loader2 className="h-8 w-8 animate-spin text-[#0068FF]" />
                  </div>
                ) : (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={state.image}
                    alt="Mã QR đăng nhập Zalo"
                    className="h-48 w-48 sm:h-52 sm:w-52 object-contain rounded-md"
                  />
                )}
              </div>

              {/* Hướng dẫn chi tiết bên phải */}
              <div className="flex-1 text-left">
                <h3 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight mb-3">
                  Quét QR để kết nối Zalo với Hchat
                </h3>

                <ol className="space-y-2.5 text-xs sm:text-sm text-slate-600 font-medium">
                  <li className="flex items-center gap-1.5 flex-wrap">
                    <span>1. Mở ứng dụng Zalo</span>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/zalo.png" alt="Zalo" className="h-4 w-4 object-contain rounded shadow-2xs inline-block" />
                    <span>trên di động</span>
                  </li>
                  <li className="flex items-center gap-1.5 flex-wrap">
                    <span>2. Ở mục</span>
                    <span className="inline-flex items-center gap-1 font-semibold text-slate-800">
                      <BsGear className="h-3.5 w-3.5 text-slate-600" /> Cài đặt,
                    </span>
                    <span>nhấn nút quét QR</span>
                    <BsQrCodeScan className="h-3.5 w-3.5 text-slate-700 shrink-0" />
                  </li>
                  <li className="flex items-center gap-1 flex-wrap">
                    <span>3. Quét mã QR để đăng nhập</span>
                  </li>
                </ol>

                <hr className="my-4 border-slate-200/80" />

                <div className="flex items-start gap-2 text-[11px] sm:text-xs text-slate-500 leading-relaxed">
                  <BsQuestionCircle className="h-3.5 w-3.5 shrink-0 text-slate-400 mt-0.5" />
                  <p>
                    Sau khi đăng nhập Zalo trên Hchat, bạn vui lòng{" "}
                    <strong className="font-bold text-slate-700">KHÔNG</strong> quét đăng nhập lại trên Zalo phiên bản website (
                    <a
                      href="https://chat.zalo.me/"
                      target="_blank"
                      rel="noreferrer"
                      className="text-slate-500 underline hover:text-slate-700"
                    >
                      https://chat.zalo.me/
                    </a>
                    ) để tránh làm gián đoạn luồng tin đồng bộ về Hchat.{" "}
                    <a href="#" className="text-primary font-medium underline hover:text-primary-hover">
                      Hướng dẫn kết nối
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {state.step === "error" && (
          <div className="flex flex-col items-center justify-center gap-4 py-10 text-center">
            <div className="flex items-center gap-2">
              <span
                className="flex h-11 w-11 items-center justify-center rounded-2xl shadow-xs"
                style={{ background: selected.badgeBg }}
              >
                <SelectedIcon className="h-5 w-5 text-white" />
              </span>
            </div>
            <p className="max-w-sm text-sm text-red-500">{state.message}</p>
            <button
              type="button"
              onClick={() => {
                setState({ step: "connecting" });
                startLogin();
              }}
              className="mt-2 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
            >
              <BsArrowRepeat className="h-4 w-4" style={{ color: selected.accent }} />
              Lấy mã QR mới
            </button>
          </div>
        )}
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
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/favi.png"
            alt="Hchat Logo"
            className="h-11 w-11 shrink-0 rounded-lg object-contain shadow-xs"
          />
          <span className="h-[1px] w-6 bg-slate-300" />
          {selected.imageSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={selected.imageSrc}
              alt={selected.label}
              className="h-11 w-11 shrink-0 rounded-lg object-contain shadow-xs"
            />
          ) : (
            <span
              className="flex h-11 w-11 items-center justify-center rounded-lg shadow-xs"
              style={{ background: selected.badgeBg }}
            >
              <SelectedIcon className="h-5 w-5 text-white" />
            </span>
          )}
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
          {selected.imageSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={selected.imageSrc} alt="" className="h-4 w-4 shrink-0 object-contain" />
          ) : (
            <SelectedIcon className="h-4 w-4" style={{ color: selected.accent }} />
          )}
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
            <BsSearch className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm trang"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-8 text-xs text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-white"
            />
            <BsSliders className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
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
            <BsKeyFill className="h-3.5 w-3.5" />
            Mã kết nối
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-2 px-8 py-10 text-center">
        <BsFillLayersFill className="h-16 w-16 text-slate-200" />
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
