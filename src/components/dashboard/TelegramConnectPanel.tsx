"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { io, type Socket } from "socket.io-client";
import {
  BsArrowRepeat,
  BsGear,
  BsQrCodeScan,
  BsQuestionCircle,
  BsPcDisplayHorizontal,
} from "react-icons/bs";
import { Loader2 } from "lucide-react";
import { CONNECTION_PLATFORMS } from "@/lib/connection-platforms";
import { toast } from "@/store/toast-store";
import { getSocketTicket } from "@/app/actions/socket";

interface TelegramLoginQrEvent {
  image: string;
}
interface TelegramLoginSuccessEvent {
  page: { id: string; name: string };
}
interface TelegramLoginErrorEvent {
  message: string;
}

// Không có bước "đã quét" (scannedBy) như Zalo — teleproto (MTProto) chỉ bắn
// 3 mốc: QR ảnh -> (có thể) yêu cầu mật khẩu 2FA -> thành công/lỗi, không có
// sự kiện trung gian "đã quét" hay "hết hạn" riêng (xem
// server/src/services/telegram/telegramLogin.service.ts).
type TelegramLoginState =
  | { step: "connecting" }
  | { step: "qr"; image: string }
  | { step: "password" }
  | { step: "success" }
  | { step: "error"; message: string };

export function TelegramConnectPanel({
  selected,
  onClose,
}: {
  selected: (typeof CONNECTION_PLATFORMS)[number];
  onClose: () => void;
}) {
  const router = useRouter();
  const SelectedIcon = selected.icon;
  const [state, setState] = React.useState<TelegramLoginState>({ step: "connecting" });
  const [password, setPassword] = React.useState("");
  const socketRef = React.useRef<Socket | null>(null);

  const startLogin = React.useCallback(async (cancelledRef: { current: boolean }) => {
    let socket = socketRef.current;
    if (!socket) {
      const ticket = await getSocketTicket();
      // React Strict Mode (dev) chạy effect 2 lần liên tiếp (mount->cleanup->
      // mount) — cleanup gọi TRƯỚC KHI getSocketTicket() ở lượt ĐẦU kịp
      // resolve, lúc đó socketRef.current vẫn còn null nên cleanup không huỷ
      // được gì cả. Không check cờ này thì lượt đầu vẫn tạo socket + chạy hết
      // luồng QR (mất ~3s kết nối MTProto) một cách vô ích, chạy chồng lên
      // lượt 2 thật sự đang hiển thị — 1 request quét QR bỗng thành 2, kết
      // nối MTProto vốn đã chậm (không nhanh như WebSocket của Zalo) bị nhân
      // đôi thời gian chờ.
      if (cancelledRef.current) return;
      if (!ticket) {
        setState({ step: "error", message: "Không tạo được kết nối, vui lòng thử lại" });
        return;
      }

      socket = io(process.env.NEXT_PUBLIC_SOCKET_URL, { auth: { ticket } });
      socketRef.current = socket;

      socket.on("telegram_login_qr", (payload: TelegramLoginQrEvent) => {
        setState({ step: "qr", image: payload.image });
      });
      socket.on("telegram_login_password_required", () => {
        setPassword("");
        setState({ step: "password" });
      });
      socket.on("telegram_login_success", (payload: TelegramLoginSuccessEvent) => {
        setState({ step: "success" });
        toast.success(`Đã kết nối Telegram "${payload.page.name}" thành công`);
        onClose();
        router.refresh();
      });
      socket.on("telegram_login_error", (payload: TelegramLoginErrorEvent) => {
        setState({ step: "error", message: payload.message });
      });
      socket.on("connect", () => socket?.emit("start_telegram_login"));
    } else {
      socket.emit("start_telegram_login");
    }
  }, [onClose, router]);

  function handleSubmitPassword() {
    if (!password) return;
    socketRef.current?.emit("submit_telegram_password", password);
  }

  React.useEffect(() => {
    const cancelledRef = { current: false };
    (async () => {
      await startLogin(cancelledRef);
    })();
    return () => {
      cancelledRef.current = true;
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
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
              {/* Mã QR với viền định vị xanh (Viewfinder frame) */}
              <div className="relative p-2 flex items-center justify-center shrink-0">
                {/* 4 góc viền xanh ôm sát QR */}
                <div className="absolute top-0 left-0 h-5 w-5 border-t-[2.5px] border-l-[2.5px] border-[#0088cc] rounded-tl-lg" />
                <div className="absolute top-0 right-0 h-5 w-5 border-t-[2.5px] border-r-[2.5px] border-[#0088cc] rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 h-5 w-5 border-b-[2.5px] border-l-[2.5px] border-[#0088cc] rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 h-5 w-5 border-b-[2.5px] border-r-[2.5px] border-[#0088cc] rounded-br-lg" />

                {state.step === "connecting" ? (
                  <div className="flex h-48 w-48 sm:h-52 sm:w-52 items-center justify-center rounded-md bg-slate-50/50">
                    <Loader2 className="h-8 w-8 animate-spin text-[#0088cc]" />
                  </div>
                ) : (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={state.image}
                    alt="Mã QR đăng nhập Telegram"
                    className="h-48 w-48 sm:h-52 sm:w-52 object-contain rounded-md"
                  />
                )}
              </div>

              {/* Hướng dẫn chi tiết bên phải */}
              <div className="flex-1 text-left">
                <h3 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight mb-3">
                  Quét QR để đăng nhập Telegram
                </h3>

                <ol className="space-y-2.5 text-xs sm:text-sm text-slate-600 font-medium">
                  <li className="flex items-center gap-1.5 flex-wrap">
                    <span>1. Mở ứng dụng Telegram</span>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/tele.png" alt="Telegram" className="h-4 w-4 object-contain rounded shadow-2xs inline-block" />
                    <span>trên di động</span>
                  </li>
                  <li className="flex items-center gap-1.5 flex-wrap">
                    <span>2. Ở mục</span>
                    <strong className="font-semibold text-slate-800">Cài đặt</strong>,
                    <span>chọn thiết bị</span>
                    <BsPcDisplayHorizontal className="h-4 w-4 text-slate-600 shrink-0 inline-block" />
                  </li>
                  <li className="flex items-center gap-1.5 flex-wrap">
                    <span>3. Nhấn Link Desktop Device</span>
                    <BsQrCodeScan className="h-4 w-4 text-slate-700 shrink-0 inline-block" />
                    <span>và quét QR để đăng nhập</span>
                  </li>
                </ol>

                <hr className="my-4 border-slate-200/80" />

                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <BsQuestionCircle className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  <a href="#" className="text-primary font-medium underline hover:text-primary-hover">
                    Hướng dẫn kết nối
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {state.step === "password" && (
          <>
            <h3 className="text-lg font-semibold text-slate-900">
              Tài khoản này đang bật xác thực 2 lớp
            </h3>
            <p className="max-w-sm text-sm text-slate-500">
              Nhập mật khẩu 2FA (cloud password) của tài khoản Telegram vừa quét để hoàn tất đăng nhập
            </p>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmitPassword();
              }}
              autoFocus
              placeholder="Mật khẩu 2FA"
              className="w-full max-w-xs rounded-lg border border-slate-200 px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <button
              type="button"
              onClick={handleSubmitPassword}
              disabled={!password}
              className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              Xác nhận
            </button>
          </>
        )}

        {state.step === "error" && (
          <>
            <div className="flex items-center gap-2">
              <span
                className="flex h-11 w-11 items-center justify-center rounded-lg shadow-xs"
                style={{ background: selected.badgeBg }}
              >
                <SelectedIcon className="h-5 w-5 text-white" />
              </span>
            </div>
            <p className="max-w-sm text-sm text-red-500">{state.message}</p>
            {/* Sai mật khẩu 2FA cũng phải quét lại QR từ đầu — teleproto
                không cho nộp lại mật khẩu cho cùng 1 lượt đăng nhập đã lỗi. */}
            <button
              type="button"
              onClick={() => {
                socketRef.current?.disconnect();
                socketRef.current = null;
                setState({ step: "connecting" });
                startLogin({ current: false });
              }}
              className="mt-2 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
            >
              <BsArrowRepeat className="h-4 w-4" style={{ color: selected.accent }} />
              Lấy mã QR mới
            </button>
          </>
        )}
      </div>
    </div>
  );
}
