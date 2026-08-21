// Đọc claim `exp` (giây, chuẩn JWT) từ access token để tính đúng maxAge cho
// cookie — thay vì hardcode 1 hằng số riêng phải tự tay khớp với
// JWT_ACCESS_EXPIRES_IN bên server. Trước đây proxy.ts và lib/session.ts mỗi
// nơi tự khai 1 hằng ACCESS_MAX_AGE=15 phút riêng, đổi JWT_ACCESS_EXPIRES_IN
// bên server (vd sang 12h) mà quên đổi cả 2 chỗ này thì cookie vẫn bị trình
// duyệt tự xoá sau 15 phút dù JWT bên trong còn hạn dài hơn nhiều — proxy
// tưởng hết hạn, cứ gọi /api/auth/refresh liên tục dù chưa cần.
export function getJwtExpiresInSeconds(token: string): number | undefined {
  try {
    const payloadB64 = token.split(".")[1];
    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"));
    if (typeof payload.exp !== "number") return undefined;
    return Math.max(0, Math.floor(payload.exp - Date.now() / 1000));
  } catch {
    return undefined;
  }
}
