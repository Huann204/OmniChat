const API_URL = process.env.API_URL || "http://localhost:3000/api";

// Route Handler (không phải file tĩnh trong public/) — CHỈ để tự điền đúng
// API_URL theo môi trường (dev/prod) ngay lúc phục vụ file, Shop dán script
// KHÔNG cần tự khai thêm attribute nào khác ngoài data-key. Đường dẫn
// "/widget.js" (có dấu chấm) CỐ TÌNH khớp để lọt qua matcher của proxy.ts
// (loại trừ mọi path có dấu "." — vốn dành cho file tĩnh/favicon), nếu không
// middleware sẽ coi đây là route gốc /[pageId] cần đăng nhập và chặn mất,
// trong khi khách vào website của Shop không hề có session đăng nhập nào.
export async function GET(request: Request) {
  // Origin CỦA CHÍNH APP NÀY (next-base) — suy từ chính request hiện tại nên
  // đúng cả dev lẫn prod, không cần thêm biến môi trường NEXT_PUBLIC_* mới.
  // Cần để build URL TUYỆT ĐỐI cho logo mặc định (public/icon-192.png) — widget
  // chạy trên domain của SHOP nên không thể dùng đường dẫn tương đối.
  const appOrigin = new URL(request.url).origin;
  const script = buildWidgetScript(API_URL, appOrigin);
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
// MVP: chỉ text (chưa ảnh/file/sticker). Nhận tin real-time qua Socket.IO
// (namespace "/widget", xem server/src/realtime/socket.ts) thay vì polling —
// tải thư viện socket.io-client qua CDN lúc cần (script nhúng ngoài, không
// bundle được qua npm), chỉ 1 kết nối sống cho cả lúc mở lẫn đóng khung chat.
function buildWidgetScript(apiUrl: string, appOrigin: string): string {
  return `(function () {
  var API_URL = ${JSON.stringify(apiUrl)};
  // Origin server (bỏ hậu tố "/api") — dùng làm địa chỉ kết nối Socket.IO,
  // suy trực tiếp từ API_URL thay vì thêm biến môi trường mới, xem
  // NEXT_PUBLIC_SOCKET_URL ở InboxView.tsx (cùng trỏ về origin y hệt API_URL).
  // CHỈ cắt "/api" khi nó nằm ở CUỐI chuỗi (.slice(-4) so sánh trực tiếp,
  // không dùng .replace("/api","")) — domain thật vd "api.hchat.site" có
  // "/api" xuất hiện SỚM HƠN ngay trong "https://api...." (do dấu "//" đứng
  // trước "api"), .replace() sẽ cắt nhầm ngay chỗ đó, phá vỡ hẳn URL (từng bị
  // đúng lỗi này, gây kết nối Socket.IO sai hẳn sang domain rác).
  var SOCKET_URL = API_URL.slice(-4) === "/api" ? API_URL.slice(0, -4) : API_URL;
  // Icon mặc định của bong bóng chat khi Shop CHƯA tự upload logo riêng (xem
  // websiteChannel.controller.ts#createWebsiteChannel/updateWebsiteChannel)
  // — bị ghi đè ngay bằng data.picture nếu Shop đã có, xem cuối file.
  var DEFAULT_LOGO = ${JSON.stringify(appOrigin + "/icon-192.png")};
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
    ".hc-bubble-icon{width:100%;height:100%;display:flex;align-items:center;justify-content:center;}",
    ".hc-bubble-icon img{width:100%;height:100%;border-radius:9999px;object-fit:cover;}",
    ".hc-badge{position:absolute;top:2px;right:2px;width:13px;height:13px;border-radius:9999px;background:linear-gradient(135deg,#ff6b6b,#e53935);display:none;box-shadow:0 1px 4px rgba(229,57,53,.6),0 0 0 2px #fff;z-index:1;}",
    ".hc-badge.show{display:block;}",
    ".hc-badge::after{content:'';position:absolute;inset:-3px;border-radius:9999px;background:rgba(239,68,68,.5);z-index:-1;animation:hcPulseRing 1.8s ease-out infinite;}",
    "@keyframes hcPulseRing{0%{transform:scale(.7);opacity:.7;}70%{transform:scale(2);opacity:0;}100%{transform:scale(2);opacity:0;}}",
    "@keyframes hcBounce{0%,100%{transform:scale(1);}30%{transform:scale(1.15);}55%{transform:scale(.95);}80%{transform:scale(1.05);}}",
    ".bubble.hc-bounce{animation:hcBounce .6s ease;}",
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
    // font-size PHẢI >=16px — dưới 16px thì Safari/Chrome trên iPhone tự
    // zoom cả trang khi bấm vào gõ chữ (hành vi mặc định trình duyệt, web
    // nhúng widget không kiểm soát được viewport để tắt kiểu khác).
    ".composer textarea{flex:1;resize:none;border:1px solid #e2e8f0;border-radius:10px;padding:8px 10px;font-size:16px;font-family:inherit;max-height:80px;outline:none;}",
    ".composer textarea:focus{border-color:var(--hc-color);}",
    ".composer button{background:var(--hc-color);color:#fff;border:none;border-radius:10px;width:38px;height:38px;flex-shrink:0;cursor:pointer;display:flex;align-items:center;justify-content:center;}",
    ".composer button:disabled{opacity:.5;cursor:not-allowed;}",
    ".composer button svg{width:16px;height:16px;fill:#fff;}",
    ".panel.hc-gate .hc-messages,.panel.hc-gate .composer{display:none;}",
    ".panel.hc-gate .hc-gate-content{display:flex;}",
    ".hc-gate-content{flex:1;overflow-y:auto;padding:20px 16px;display:none;flex-direction:column;background:#fff;}",
    ".hc-gate-content h4{margin:0 0 4px;font-size:14px;font-weight:600;color:#0f172a;}",
    ".hc-gate-subtitle{margin:0 0 14px;font-size:12px;color:#94a3b8;}",
    ".hc-field{margin-bottom:12px;}",
    ".hc-field label{display:block;margin-bottom:4px;font-size:12px;font-weight:500;color:#475569;}",
    ".hc-field input{box-sizing:border-box;width:100%;border:1px solid #e2e8f0;border-radius:8px;padding:8px 10px;font-size:16px;font-family:inherit;outline:none;}",
    ".hc-field input:focus{border-color:var(--hc-color);}",
    ".hc-gate-error{display:none;margin:-6px 0 10px;font-size:11px;color:#ef4444;}",
    ".hc-gate-error.show{display:block;}",
    ".hc-gate-submit{margin-top:4px;width:100%;border:none;border-radius:9999px;background:var(--hc-color);padding:12px;font-size:14px;font-weight:600;color:#fff;cursor:pointer;font-family:inherit;}",
    ".hc-gate-submit:disabled{opacity:.6;cursor:not-allowed;}",
    ".hc-contact-label{font-size:12px;color:#64748b;text-align:center;margin:16px 0 8px;}",
    ".hc-contact-channels{display:flex;gap:16px;justify-content:center;}",
    ".hc-contact-btn{display:flex;flex-direction:column;align-items:center;gap:4px;background:none;border:none;cursor:pointer;font-size:11px;color:#475569;font-family:inherit;padding:0;}",
    ".hc-contact-icon{width:44px;height:44px;border-radius:9999px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,.15);}",
    ".hc-contact-icon svg{width:22px;height:22px;fill:#fff;}",
    ".hc-contact-icon.zalo{background:#fff;border:1px solid #e2e8f0;color:#0068FF;font-weight:700;font-size:10px;}"
  ].join("");
  root.appendChild(style);

  var bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.innerHTML =
    '<span class="hc-bubble-icon"><img src="' + DEFAULT_LOGO + '" alt="" /></span>' +
    '<span class="hc-badge"></span>';
  root.appendChild(bubble);
  var bubbleIconEl = bubble.querySelector(".hc-bubble-icon");
  var badgeEl = bubble.querySelector(".hc-badge");

  var panel = document.createElement("div");
  panel.className = "panel";
  panel.innerHTML =
    '<div class="header"><span class="header-left"><img class="hc-header-avatar header-avatar" alt="" /><span class="hc-title">Chat với chúng tôi</span></span><button type="button" class="hc-close" aria-label="Đóng">\\u2715</button></div>' +
    '<div class="hc-gate-content"></div>' +
    '<div class="messages hc-messages"></div>' +
    '<div class="composer"><textarea rows="1" placeholder="Nhập tin nhắn..." class="hc-input"></textarea><button type="button" class="hc-send" aria-label="Gửi"><svg viewBox="0 0 24 24"><path d="M2 21l21-9L2 3v7l15 2-15 2z"/></svg></button></div>';
  root.appendChild(panel);

  var titleEl = panel.querySelector(".hc-title");
  var headerAvatarEl = panel.querySelector(".hc-header-avatar");
  var messagesEl = panel.querySelector(".hc-messages");
  var inputEl = panel.querySelector(".hc-input");
  var sendBtn = panel.querySelector(".hc-send");
  var closeBtn = panel.querySelector(".hc-close");
  var gateEl = panel.querySelector(".hc-gate-content");

  var isOpen = false;
  var renderedIds = {};
  var unreadCount = 0;
  var pageTitle = document.title;

  // Mốc thời gian tin nhắn (sender="page") GẦN NHẤT khách đã THẬT SỰ mở
  // khung chat để xem — dùng để phân biệt "tin cũ đã xem rồi" (tải lại lúc
  // trang mới load) với "tin mới tới trong lúc khung chat đang đóng" (mới
  // cần tính vào badge). Lưu localStorage để sống được qua nhiều lần tải
  // trang/đóng mở tab, không chỉ trong 1 phiên.
  var lastSeenKey = "hchat_widget_lastseen_" + widgetKey;
  var lastSeenAt = localStorage.getItem(lastSeenKey) || "";
  var latestMessageAt = lastSeenAt;

  // Đã từng vào tới khung chat thật (qua hết "cổng" nếu có) trên máy này —
  // dùng để quyết định có tự kết nối Socket.IO NGAY LÚC TẢI TRANG hay không
  // (để nhận tin ngầm dù khung chat đang đóng), xem connectRealtime(). Không
  // tự kết nối cho khách CHƯA từng bấm vào chat (tránh gọi getWidgetMessages
  // tạo Conversation/lời chào cho khách chỉ lướt web chưa hề quan tâm tới
  // chat, xem widget.controller.ts#getWidgetMessages).
  var engagedKey = "hchat_widget_engaged_" + widgetKey;
  var hasEngaged = localStorage.getItem(engagedKey) === "1";

  function updateBadge() {
    if (unreadCount > 0) {
      badgeEl.classList.add("show");
      document.title = "(" + unreadCount + ") " + pageTitle;
    } else {
      badgeEl.classList.remove("show");
      document.title = pageTitle;
    }
  }

  // Khách vừa THẬT SỰ mở khung chat lên xem — coi như đã đọc hết tới tin mới
  // nhất đã biết, lưu lại mốc này để lần tải trang SAU không tính nhầm những
  // tin CŨ (đã xem ở lượt trước) thành chưa đọc.
  function markSeen() {
    lastSeenAt = latestMessageAt;
    localStorage.setItem(lastSeenKey, lastSeenAt);
    unreadCount = 0;
    updateBadge();
  }

  // Màn hình "cổng" trước khi vào khung chat thật — gộp CHUNG 1 màn hình cho
  // cả 2 tính năng độc lập của Shop: form "trước khi chat" (widgetConfig.
  // preChatFields, Tên bạn/Email/SĐT/Tỉnh) và "kênh liên hệ nhanh"
  // (widgetConfig.contactChannels, Facebook/Zalo/gọi điện) — Shop có thể bật
  // 1 trong 2, cả 2, hoặc không bật gì. Gộp chung (thay vì 2 màn hình nối
  // tiếp như bản đầu) để khách không phải bấm thêm 1 bước mới thấy được form,
  // đỡ gây cảm giác "trường bị mất" khi Shop bật thêm kênh liên hệ.
  var PRECHAT_LABELS = { name: "Tên bạn", email: "Email", phone: "Số điện thoại", city: "Tỉnh/Thành" };
  var PRECHAT_TYPES = { name: "text", email: "email", phone: "tel", city: "text" };
  // Icon Facebook/gọi điện dùng SVG glyph đơn giản; Zalo không có path SVG
  // đơn giản chuẩn nên hiện chữ "Zalo" cách điệu trên nền trắng cho gần
  // giống logo thật.
  var CONTACT_META = {
    facebook: {
      color: "#1877F2",
      label: "Facebook",
      icon: '<svg viewBox="0 0 24 24"><path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.99 3.66 9.13 8.44 9.88v-6.99H7.9v-2.89h2.54V9.8c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.45 2.89h-2.33v6.99C18.34 21.13 22 16.99 22 12z"/></svg>',
    },
    zalo: { color: "#fff", label: "Zalo", text: "Zalo" },
    phone: {
      color: "#FF7A00",
      label: "Gọi điện",
      icon: '<svg viewBox="0 0 24 24"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>',
    },
  };
  var gateDoneKey = "hchat_widget_gate_done_" + widgetKey;
  var gateDone = localStorage.getItem(gateDoneKey) === "1";
  var pendingPrechatFields = null;
  var pendingContactChannels = null;

  function openContactChannel(key, value) {
    if (key === "facebook") {
      window.open(value, "_blank");
    } else if (key === "zalo") {
      window.open(value.indexOf("http") === 0 ? value : "https://zalo.me/" + value, "_blank");
    } else if (key === "phone") {
      window.location.href = "tel:" + value.replace(/[^0-9+]/g, "");
    }
  }

  function buildGateScreen(fields, channels) {
    var html = "";
    if (fields && fields.length > 0) {
      html += '<h4>Bắt đầu trò chuyện</h4><p class="hc-gate-subtitle">Vui lòng nhập thông tin bên dưới</p>';
      fields.forEach(function (f) {
        var label = PRECHAT_LABELS[f.key] || f.key;
        var type = PRECHAT_TYPES[f.key] || "text";
        html +=
          '<div class="hc-field"><label>' +
          label +
          (f.required ? ' <span style="color:#ef4444">*</span>' : "") +
          '</label><input type="' +
          type +
          '" data-variable="' +
          f.variable +
          '" data-required="' +
          (f.required ? "1" : "0") +
          '" /></div>';
      });
    }
    html += '<div class="hc-gate-error"></div>';
    html += '<button type="button" class="hc-gate-submit">Bắt đầu trò chuyện</button>';
    if (channels) {
      var keys = Object.keys(channels);
      if (keys.length > 0) {
        html += '<p class="hc-contact-label">Liên hệ qua kênh yêu thích của bạn</p><div class="hc-contact-channels">';
        keys.forEach(function (key) {
          var meta = CONTACT_META[key];
          if (!meta) return;
          html +=
            '<button type="button" class="hc-contact-btn" data-key="' +
            key +
            '"><span class="hc-contact-icon ' +
            (key === "zalo" ? "zalo" : "") +
            '" style="' +
            (key === "zalo" ? "" : "background:" + meta.color) +
            '">' +
            (meta.icon || meta.text) +
            "</span>" +
            meta.label +
            "</button>";
        });
        html += "</div>";
      }
    }
    gateEl.innerHTML = html;

    function finishGate() {
      gateDone = true;
      localStorage.setItem(gateDoneKey, "1");
      panel.classList.remove("hc-gate");
      enterChat();
    }

    var submitBtn = gateEl.querySelector(".hc-gate-submit");
    var errorEl = gateEl.querySelector(".hc-gate-error");
    submitBtn.addEventListener("click", function () {
      if (!fields || fields.length === 0) {
        finishGate();
        return;
      }
      var inputs = gateEl.querySelectorAll("input[data-variable]");
      var values = {};
      var missing = false;
      inputs.forEach(function (inp) {
        var v = inp.value.trim();
        if (inp.getAttribute("data-required") === "1" && !v) missing = true;
        if (v) values[inp.getAttribute("data-variable")] = v;
      });
      if (missing) {
        errorEl.textContent = "Vui lòng điền đầy đủ thông tin bắt buộc";
        errorEl.classList.add("show");
        return;
      }
      errorEl.classList.remove("show");
      submitBtn.disabled = true;
      fetch(API_URL + "/widget/" + widgetKey + "/visitor-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitorId: visitorId, values: values }),
      })
        .then(finishGate)
        .catch(function () {
          errorEl.textContent = "Có lỗi xảy ra, vui lòng thử lại";
          errorEl.classList.add("show");
        })
        .finally(function () {
          submitBtn.disabled = false;
        });
    });

    gateEl.querySelectorAll(".hc-contact-btn").forEach(function (btn) {
      var key = btn.getAttribute("data-key");
      btn.addEventListener("click", function () {
        openContactChannel(key, channels[key]);
      });
    });
  }

  function renderMessages(messages) {
    var newFromPage = false;
    messages.forEach(function (m) {
      if (renderedIds[m.id]) return;
      renderedIds[m.id] = true;
      var el = document.createElement("div");
      el.className = "msg " + (m.sender === "customer" ? "customer" : "page");
      el.textContent = m.text || "";
      messagesEl.appendChild(el);
      if (m.createdAt > latestMessageAt) latestMessageAt = m.createdAt;
      // Chỉ tính "chưa đọc" khi: (1) đúng là tin từ Shop, (2) khung chat
      // ĐANG ĐÓNG, và (3) mới hơn lần khách xem gần nhất (markSeen) — tránh
      // đếm nhầm cả lịch sử cũ thành chưa đọc mỗi lần tải lại trang.
      if (m.sender === "page" && !isOpen && m.createdAt > lastSeenAt) {
        unreadCount++;
        newFromPage = true;
      }
    });
    messagesEl.scrollTop = messagesEl.scrollHeight;
    if (newFromPage) {
      updateBadge();
      bubble.classList.remove("hc-bounce");
      void bubble.offsetWidth; // reflow để restart animation nếu tin dồn dập tới liên tiếp
      bubble.classList.add("hc-bounce");
    }
  }

  function fetchMessagesOnce() {
    return fetch(API_URL + "/widget/" + widgetKey + "/messages?visitorId=" + encodeURIComponent(visitorId))
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data && data.success) renderMessages(data.messages || []);
      })
      .catch(function () {});
  }

  // Tải thư viện socket.io-client qua CDN (script nhúng ngoài, không bundle
  // qua npm được) — chỉ tải 1 lần, tái dùng lại window.io cho các lần gọi
  // sau (vd 2 tab/2 widget cùng site sẽ không tải trùng).
  function loadSocketLib() {
    if (window.io) return Promise.resolve();
    return new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = "https://cdn.socket.io/4.8.1/socket.io.min.js";
      s.onload = function () { resolve(); };
      s.onerror = function () { reject(new Error("socket.io-client load failed")); };
      document.head.appendChild(s);
    });
  }

  // Nối vào ĐÚNG room hội thoại của khách này trên namespace "/widget" (xem
  // server/src/realtime/socket.ts) — mỗi khách chỉ nghe được tin của CHÍNH
  // hội thoại mình, không nghe được khách khác cùng website. Tự join lại mỗi
  // lần "connect" (kể cả sau khi tự reconnect do mất mạng), không chỉ lần
  // đầu.
  function joinConversation(socket) {
    socket.on("connect", function () {
      socket.emit("join_conversation", { widgetKey: widgetKey, visitorId: visitorId });
    });
    socket.on("new_message", function (payload) {
      if (!payload || !payload.message) return;
      renderMessages([{
        id: payload.message.id,
        sender: payload.message.sender,
        text: payload.message.text,
        createdAt: payload.message.createdAt,
      }]);
    });
  }

  // Kết nối realtime — gọi ĐÚNG 1 LẦN cho cả vòng đời trang (không phân biệt
  // khung chat đang mở hay đóng, khác bản polling cũ phải tách 2 tần suất):
  // tải lịch sử tin nhắn 1 lần (cũng là lúc tạo Conversation/lời chào nếu
  // đây là lần đầu, xem widget.controller.ts#getWidgetMessages) rồi giữ 1
  // kết nối Socket.IO sống để nhận tin mới ngay khi có, dù khách đang xem
  // khung chat hay đang lướt chỗ khác trên website.
  var realtimeConnected = false;
  function connectRealtime() {
    if (realtimeConnected) return;
    realtimeConnected = true;
    fetchMessagesOnce().then(function () {
      loadSocketLib()
        .then(function () {
          joinConversation(window.io(SOCKET_URL + "/widget"));
        })
        .catch(function () {});
    });
  }

  // Đánh dấu đã thật sự vào khung chat (qua hết "cổng" nếu có) — gọi ở CẢ 2
  // nơi khách có thể vào chat: mở panel thẳng (không có cổng, hoặc cổng đã
  // xong từ trước) và bấm xong "Bắt đầu trò chuyện" ở cổng (finishGate).
  function enterChat() {
    if (!hasEngaged) {
      hasEngaged = true;
      localStorage.setItem(engagedKey, "1");
    }
    connectRealtime();
  }

  function openPanel() {
    isOpen = true;
    panel.classList.add("open");
    markSeen();
    bubble.classList.remove("hc-bounce");
    if ((pendingPrechatFields || pendingContactChannels) && !gateDone) {
      panel.classList.add("hc-gate");
    } else {
      enterChat();
    }
  }

  function closePanel() {
    isOpen = false;
    panel.classList.remove("open");
  }

  // Khách quay lại website (đã từng chat trước đó, xem hasEngaged) mà chưa
  // kịp bấm mở khung chat lần này — vẫn cần biết có tin mới từ lúc đó tới
  // giờ, nên kết nối realtime NGAY LÚC TẢI TRANG, không đợi khách bấm bong
  // bóng.
  if (hasEngaged) connectRealtime();

  // Chờ configPromise (tải xong preChatFields) trước khi thật sự mở khung —
  // tránh trường hợp khách bấm bong bóng NGAY LÚC trang vừa tải, config chưa
  // kịp về, sẽ bỏ lỡ mất màn hình form (mở thẳng vào chat dù Shop đã bật form
  // bắt buộc).
  bubble.addEventListener("click", function () {
    if (isOpen) {
      closePanel();
      return;
    }
    configPromise.then(openPanel);
  });
  closeBtn.addEventListener("click", closePanel);

  // Không cần tự fetch/render lại sau khi gửi — kết nối realtime đã join
  // sẵn room hội thoại (chỉ gửi được tin khi đã ở trong khung chat thật, tức
  // connectRealtime() đã chạy), tin vừa gửi sẽ tự về qua sự kiện
  // "new_message" gần như ngay lập tức, xem joinConversation().
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

  var configPromise = fetch(API_URL + "/widget/" + widgetKey)
    .then(function (r) { return r.json(); })
    .then(function (data) {
      if (!data || !data.success) return;
      if (data.name) titleEl.textContent = data.name;
      // Logo Shop tải lên (widgetConfig/Media, xem widget.controller.ts) làm
      // luôn icon bong bóng chat (thay hình mặc định) + avatar nhỏ trong
      // header — chỉ có ý nghĩa khi Shop đã upload, không thì giữ icon mặc
      // định như cũ.
      if (data.picture) {
        bubbleIconEl.innerHTML = '<img src="' + data.picture + '" alt="" />';
        headerAvatarEl.src = data.picture;
        headerAvatarEl.style.display = "block";
      }
      if (data.primaryColor) host.style.setProperty("--hc-color", data.primaryColor);
      if (data.position === "left") {
        bubble.classList.add("left");
        panel.classList.add("left");
      }
      if (gateDone) return;
      if (data.preChatFields && data.preChatFields.length > 0) {
        pendingPrechatFields = data.preChatFields;
      }
      if (data.contactChannels) {
        var channels = {};
        ["facebook", "zalo", "phone"].forEach(function (key) {
          if (data.contactChannels[key]) channels[key] = data.contactChannels[key];
        });
        if (Object.keys(channels).length > 0) pendingContactChannels = channels;
      }
      if (pendingPrechatFields || pendingContactChannels) {
        buildGateScreen(pendingPrechatFields, pendingContactChannels);
      }
    })
    .catch(function () {});
})();
`;
}
