import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["*.ngrok-free.dev", "*.ngrok-free.app", "*.ngrok.io"],
  images: {
    // "res.cloudinary.com" giữ lại cho ảnh/avatar CŨ upload từ trước khi
    // chuyển sang Cloudflare R2 (URL cũ không đổi, vẫn cần tải được) —
    // "**.r2.dev"/"**.r2.cloudflarestorage.com" cho domain public tạm của R2,
    // domain custom riêng (nếu có) cần thêm thủ công theo giá trị thật của
    // R2_PUBLIC_URL.
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "*.r2.dev" },
      { protocol: "https", hostname: "*.r2.cloudflarestorage.com" },
    ],
  },
};

export default nextConfig;
