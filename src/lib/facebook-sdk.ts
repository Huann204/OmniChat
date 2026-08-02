"use client";

declare global {
  interface Window {
    FB?: {
      init: (params: {
        appId: string;
        version: string;
        cookie?: boolean;
        xfbml?: boolean;
      }) => void;
      login: (
        callback: (response: FacebookLoginResponse) => void,
        options: { scope: string }
      ) => void;
    };
    fbAsyncInit?: () => void;
  }
}

export interface FacebookLoginResponse {
  status: "connected" | "not_authorized" | "unknown";
  authResponse?: {
    accessToken: string;
    userID: string;
  };
}

const GRAPH_VERSION = "v21.0";
let sdkReadyPromise: Promise<void> | null = null;

function loadSdk(): Promise<void> {
  if (sdkReadyPromise) return sdkReadyPromise;

  const appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
  if (!appId) {
    return Promise.reject(
      new Error("Thiếu NEXT_PUBLIC_FACEBOOK_APP_ID trong biến môi trường")
    );
  }

  sdkReadyPromise = new Promise((resolve) => {
    if (window.FB) {
      resolve();
      return;
    }

    window.fbAsyncInit = () => {
      window.FB!.init({ appId, version: GRAPH_VERSION, cookie: false, xfbml: false });
      resolve();
    };

    const script = document.createElement("script");
    script.src = "https://connect.facebook.net/vi_VN/sdk.js";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
  });

  return sdkReadyPromise;
}

// pages_show_list: liệt kê Page user quản lý (kèm ảnh đại diện, không cần
// thêm quyền gì khác cho việc đó).
// pages_messaging: bắt buộc để subscribe Page nhận webhook "messages".
export async function loginWithFacebook(): Promise<string> {
  await loadSdk();

  return new Promise((resolve, reject) => {
    window.FB!.login(
      (response) => {
        if (response.status === "connected" && response.authResponse) {
          resolve(response.authResponse.accessToken);
        } else {
          reject(new Error("Bạn đã huỷ đăng nhập hoặc chưa cấp quyền cho Facebook"));
        }
      },
      { scope: "pages_show_list,pages_messaging" }
    );
  });
}
