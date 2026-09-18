const API_URL = process.env.API_URL || "http://localhost:3000/api";

// Route Handler (không phải file tĩnh trong public/) — CHỈ để tự điền đúng
// API_URL theo môi trường (dev/prod) ngay lúc phục vụ file, Shop dán script
// KHÔNG cần tự khai thêm attribute nào khác ngoài data-key. Đường dẫn
// "/widget.js" (có dấu chấm) CỐ TÌNH khớp để lọt qua matcher của proxy.ts
// (loại trừ mọi path có dấu "." — vốn dành cho file tĩnh/favicon), nếu không
// middleware sẽ coi đây là route gốc /[pageId] cần đăng nhập và chặn mất,
// trong khi khách vào website của Shop không hề có session đăng nhập nào.
export async function GET() {
  const script = buildWidgetScript(API_URL);
  return new Response(script, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      // Cache ngắn — script hiếm khi đổi nhưng vẫn muốn bản sửa lỗi/tính năng
      // mới tới tay Shop trong vài phút, không phải chờ Cloudflare/browser tự
      // hết cache theo mặc định.
      "Cache-Control": "public, max-age=300",
    },
  });
}

// Widget chat nhúng — vanilla JS thuần, KHÔNG phụ thuộc thư viện ngoài (Shop
// dán vào website của họ, không thể đòi hỏi họ tự cài React/jQuery...). Dùng
// Shadow DOM để cô lập hoàn toàn CSS 2 chiều: CSS của website Shop không làm
// vỡ giao diện widget, và CSS widget cũng không rò ra ngoài làm hỏng trang
// của Shop — đây là cách các widget chat thật (Intercom, Crisp...) đều làm.
// MVP: chỉ text (chưa ảnh/file/sticker), polling mỗi 4s khi khung chat đang
// mở (chưa dùng WebSocket — đơn giản hơn, đủ dùng cho bản đầu).
function buildWidgetScript(apiUrl: string): string {
  return `(function () {
  var API_URL = ${JSON.stringify(apiUrl)};
  var scriptEl = document.currentScript;
  var widgetKey = scriptEl && scriptEl.getAttribute("data-key");
  if (!widgetKey) {
    console.error("[Hchat Widget] Thiếu data-key trên thẻ <script>");
    return;
  }

  var visitorKey = "hchat_widget_visitor_" + widgetKey;
  var visitorId = localStorage.getItem(visitorKey);
  if (!visitorId) {
    visitorId = (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(36).slice(2));
    localStorage.setItem(visitorKey, visitorId);
  }

  var host = document.createElement("div");
  host.id = "hchat-widget-host";
  document.body.appendChild(host);
  var root = host.attachShadow({ mode: "open" });

  // --hc-color: đặt qua host.style.setProperty() ngay khi getWidgetConfig trả
  // về xong (xem cuối file) — mặc định #2563eb khi Shop chưa tuỳ biến gì.
  var style = document.createElement("style");
  style.textContent = [
    ":host{all:initial;--hc-color:#2563eb;}",
    ".bubble{position:fixed;bottom:20px;right:20px;width:56px;height:56px;border-radius:9999px;background:var(--hc-color);box-shadow:0 4px 14px rgba(0,0,0,.25);display:flex;align-items:center;justify-content:center;cursor:pointer;z-index:2147483000;transition:transform .15s;}",
    ".bubble.left{right:auto;left:20px;}",
    ".bubble:hover{transform:scale(1.06);}",
    ".bubble svg{width:26px;height:26px;fill:#fff;}",
    ".bubble img{width:100%;height:100%;border-radius:9999px;object-fit:cover;}",
    ".header-left{display:flex;align-items:center;gap:8px;min-width:0;}",
    ".header-avatar{width:24px;height:24px;border-radius:9999px;object-fit:cover;flex-shrink:0;display:none;}",
    ".hc-title{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}",
    ".panel{position:fixed;bottom:88px;right:20px;width:340px;max-width:calc(100vw - 32px);height:460px;max-height:calc(100vh - 120px);background:#fff;border-radius:16px;box-shadow:0 10px 40px rgba(0,0,0,.2);display:none;flex-direction:column;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;z-index:2147483000;}",
    ".panel.left{right:auto;left:20px;}",
    ".panel.open{display:flex;}",
    ".header{background:var(--hc-color);color:#fff;padding:14px 16px;font-size:14px;font-weight:600;display:flex;align-items:center;justify-content:space-between;}",
    ".header button{background:none;border:none;color:#fff;font-size:18px;cursor:pointer;line-height:1;opacity:.85;}",
    ".header button:hover{opacity:1;}",
    ".messages{flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:8px;background:#f8fafc;}",
    ".msg{max-width:78%;padding:8px 12px;border-radius:14px;font-size:13px;line-height:1.4;white-space:pre-wrap;word-break:break-word;}",
    ".msg.customer{align-self:flex-end;background:var(--hc-color);color:#fff;border-bottom-right-radius:4px;}",
    ".msg.page{align-self:flex-start;background:#e2e8f0;color:#0f172a;border-bottom-left-radius:4px;}",
    ".composer{display:flex;gap:8px;padding:10px;border-top:1px solid #e2e8f0;background:#fff;}",
    ".composer textarea{flex:1;resize:none;border:1px solid #e2e8f0;border-radius:10px;padding:8px 10px;font-size:13px;font-family:inherit;max-height:80px;outline:none;}",
    ".composer textarea:focus{border-color:var(--hc-color);}",
    ".composer button{background:var(--hc-color);color:#fff;border:none;border-radius:10px;width:38px;height:38px;flex-shrink:0;cursor:pointer;display:flex;align-items:center;justify-content:center;}",
    ".composer button:disabled{opacity:.5;cursor:not-allowed;}",
    ".composer button svg{width:16px;height:16px;fill:#fff;}"
  ].join("");
  root.appendChild(style);

  var bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.innerHTML = '<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.03 2 11c0 2.61 1.28 4.95 3.32 6.61L4 22l4.5-1.5C9.6 20.83 10.78 21 12 21c5.52 0 10-4.03 10-9s-4.48-10-10-10z"/></svg>';
  root.appendChild(bubble);

  var panel = document.createElement("div");
  panel.className = "panel";
  panel.innerHTML =
    '<div class="header"><span class="header-left"><img class="hc-header-avatar header-avatar" alt="" /><span class="hc-title">Chat với chúng tôi</span></span><button type="button" class="hc-close" aria-label="Đóng">\\u2715</button></div>' +
    '<div class="messages hc-messages"></div>' +
    '<div class="composer"><textarea rows="1" placeholder="Nhập tin nhắn..." class="hc-input"></textarea><button type="button" class="hc-send" aria-label="Gửi"><svg viewBox="0 0 24 24"><path d="M2 21l21-9L2 3v7l15 2-15 2z"/></svg></button></div>';
  root.appendChild(panel);

  var titleEl = panel.querySelector(".hc-title");
  var headerAvatarEl = panel.querySelector(".hc-header-avatar");
  var messagesEl = panel.querySelector(".hc-messages");
  var inputEl = panel.querySelector(".hc-input");
  var sendBtn = panel.querySelector(".hc-send");
  var closeBtn = panel.querySelector(".hc-close");

  var isOpen = false;
  var pollTimer = null;
  var renderedIds = {};

  function renderMessages(messages) {
    messages.forEach(function (m) {
      if (renderedIds[m.id]) return;
      renderedIds[m.id] = true;
      var el = document.createElement("div");
      el.className = "msg " + (m.sender === "customer" ? "customer" : "page");
      el.textContent = m.text || "";
      messagesEl.appendChild(el);
    });
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function poll() {
    fetch(API_URL + "/widget/" + widgetKey + "/messages?visitorId=" + encodeURIComponent(visitorId))
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data && data.success) renderMessages(data.messages || []);
      })
      .catch(function () {});
  }

  function startPolling() {
    poll();
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = setInterval(poll, 4000);
  }

  function stopPolling() {
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = null;
  }

  function openPanel() {
    isOpen = true;
    panel.classList.add("open");
    startPolling();
  }

  function closePanel() {
    isOpen = false;
    panel.classList.remove("open");
    stopPolling();
  }

  bubble.addEventListener("click", function () {
    if (isOpen) closePanel();
    else openPanel();
  });
  closeBtn.addEventListener("click", closePanel);

  function send() {
    var text = inputEl.value.trim();
    if (!text) return;
    inputEl.value = "";
    sendBtn.disabled = true;
    fetch(API_URL + "/widget/" + widgetKey + "/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visitorId: visitorId, text: text }),
    })
      .then(function () { poll(); })
      .catch(function () {})
      .finally(function () { sendBtn.disabled = false; });
  }

  sendBtn.addEventListener("click", send);
  inputEl.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  });

  fetch(API_URL + "/widget/" + widgetKey)
    .then(function (r) { return r.json(); })
    .then(function (data) {
      if (!data || !data.success) return;
      if (data.name) titleEl.textContent = data.name;
      // Logo Shop tải lên (widgetConfig/Media, xem widget.controller.ts) làm
      // luôn icon bong bóng chat (thay hình mặc định) + avatar nhỏ trong
      // header — chỉ có ý nghĩa khi Shop đã upload, không thì giữ icon mặc
      // định như cũ.
      if (data.picture) {
        bubble.innerHTML = '<img src="' + data.picture + '" alt="" />';
        headerAvatarEl.src = data.picture;
        headerAvatarEl.style.display = "block";
      }
      if (data.primaryColor) host.style.setProperty("--hc-color", data.primaryColor);
      if (data.position === "left") {
        bubble.classList.add("left");
        panel.classList.add("left");
      }
    })
    .catch(function () {});
})();
`;
}
