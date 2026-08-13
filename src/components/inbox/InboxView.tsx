"use client";

import * as React from "react";
import { io, type Socket } from "socket.io-client";
import { BsChatSquareTextFill } from "react-icons/bs";
import { generateAiSuggestions } from "@/app/actions/aiAssistant";
import {
  getOlderMessages,
  markConversationRead,
  reactToMessage,
  sendMessage,
} from "@/app/actions/conversation";
import { setConversationTags } from "@/app/actions/conversationTag";
import { getSocketTicket } from "@/app/actions/socket";
import {
  formatClock,
  formatTimeLabel,
  messageKindAndContent,
  messagePreviewText,
} from "@/lib/message-format";
import { toast } from "@/store/toast-store";
import type { AiAssistantSettings } from "@/types/aiAssistant";
import type { Bot } from "@/types/bot";
import type { Conversation, ConversationMessage } from "@/types/conversation";
import type { ConversationTag } from "@/types/conversationTag";
import type { QuickReply } from "@/types/quickReply";
import { cn } from "@/lib/utils";
import { InboxIconRail } from "./InboxIconRail";
import { ConversationList } from "./ConversationList";
import { ChatHeader } from "./ChatHeader";
import { MessageThread, type ReplyTarget } from "./MessageThread";
import { QuickTagBar } from "./QuickTagBar";
import { AiSuggestionBar } from "./AiSuggestionBar";
import { MessageComposer, type MessageComposerHandle } from "./MessageComposer";
import { CustomerInfoPanel } from "./CustomerInfoPanel";

interface NewMessageEvent {
  conversationId: string;
  conversation: {
    id: string;
    pageId: string;
    type: number;
    customerName?: string;
    customerAvatarUrl?: string;
    isGroup?: boolean;
    lastMessage?: string;
    lastMessageAt: string;
    isRead: boolean;
  };
  message: {
    id: string;
    sender: "customer" | "page";
    text?: string;
    attachments?: { type: string; url: string }[];
    // Chỉ có khi hội thoại là nhóm và tin do 1 thành viên khác gửi.
    senderName?: string;
    senderAvatarUrl?: string;
    // Snippet khung trích dẫn nếu tin này LÀ 1 lời trả lời — xem
    // message.model.ts#replyPreviewText.
    replyPreviewText?: string;
    createdAt: string;
    // id tạm phía mình tự sinh lúc gửi — server echo lại nguyên văn (xem
    // NewMessageEvent trong realtime/socket.ts) để đối chiếu, biết đây là
    // tin CHÍNH MÌNH vừa gửi (đã hiện optimistic rồi) hay tin mới thật sự.
    clientId?: string;
  };
}

interface MessageReactionEvent {
  conversationId: string;
  messageId: string;
  reactionIcon?: string;
}

interface InboxViewProps {
  bot: Bot;
  initialConversations: Conversation[];
  // Danh sách Page thật cần join room realtime — mặc định chỉ [bot.id].
  // Truyền nhiều id khi đang xem gộp tạm thời nhiều Page cùng lúc.
  socketPageIds?: string[];
  // Tra cứu tên + avatar Page theo pageId — chỉ cần truyền khi xem gộp nhiều
  // Page, để hiện rõ mỗi hội thoại thuộc Page nào.
  pagesById?: Record<string, { name: string; avatarUrl?: string }>;
  // Mẫu trả lời nhanh của Shop — gõ ký tự tắt trong khung soạn tin để chèn
  // nhanh (xem MessageComposer). Snapshot lúc tải trang, không tự đồng bộ
  // real-time nếu sửa ở Cài đặt trong lúc đang mở sẵn Livechat ở tab khác.
  quickReplies?: QuickReply[];
  // Danh mục thẻ hội thoại của Shop (xem /settings/tags) — QuickTagBar hiện
  // hết danh mục này, đánh dấu thẻ nào đang gắn cho hội thoại đang mở.
  conversationTags?: ConversationTag[];
  // Cấu hình "Gợi ý trả lời tin nhắn từ AI" (xem /settings/ai-assistant) —
  // quyết định có tự gọi sinh gợi ý không, và khi nào (mở hội thoại, hay
  // mỗi tin mới), xem effect gọi generateAiSuggestions bên dưới.
  aiAssistantSettings?: AiAssistantSettings;
}

export function InboxView({
  bot,
  initialConversations,
  socketPageIds,
  pagesById,
  quickReplies,
  conversationTags,
  aiAssistantSettings,
}: InboxViewProps) {
  const [conversations, setConversations] = React.useState<Conversation[]>(initialConversations);
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");
  // Đang trả lời trích dẫn tin nào (bấm nút Trả lời trong MessageThread) —
  // hiện thành 1 khung trên MessageComposer, xem handleReply/handleSend.
  const [replyingTo, setReplyingTo] = React.useState<ReplyTarget | null>(null);
  const [showCustomerInfo, setShowCustomerInfo] = React.useState(false);

  const activeConversation = conversations.find((c) => c.id === activeId) ?? null;
  const pageIds = socketPageIds ?? [bot.id];
  const pageIdsKey = pageIds.join(",");

  // Đọc được activeId mới nhất bên trong callback của socket mà không phải
  // đưa activeId vào dependency của effect kết nối socket (tránh disconnect
  // + reconnect mỗi lần user chọn hội thoại khác).
  const activeIdRef = React.useRef(activeId);
  React.useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

  // Âm thanh báo tin nhắn mới — tạo 1 lần, phát lại (không tạo mới mỗi lần)
  // để không phải tải lại file mỗi khi có tin đến.
  const notificationSoundRef = React.useRef<HTMLAudioElement | null>(null);
  React.useEffect(() => {
    notificationSoundRef.current = new Audio("/nhacchuong.mp3");
  }, []);

  // Đánh số thứ tự request bật/tắt thẻ theo TỪNG hội thoại — bấm nhiều thẻ
  // liên tiếp nhanh sinh nhiều request API cùng lúc, response có thể về
  // KHÔNG đúng thứ tự gửi đi (request cũ về sau request mới). Chỉ áp dụng
  // kết quả của request MỚI NHẤT đã gửi cho đúng hội thoại đó, bỏ qua response
  // đến muộn của các request đã bị "vượt mặt" — tránh giật/lùi trạng thái.
  const tagRequestSeqRef = React.useRef<Map<string, number>>(new Map());

  // Gợi ý trả lời từ AI (xem AiSuggestionBar) — điền vào ô soạn tin qua ref
  // (MessageComposer tự quản lý state nội bộ, không nhận value từ prop).
  const composerRef = React.useRef<MessageComposerHandle>(null);
  const [aiSuggestions, setAiSuggestions] = React.useState<string[]>([]);
  const [aiSuggestionsLoading, setAiSuggestionsLoading] = React.useState(false);
  // Đọc được cấu hình mới nhất bên trong closure của socket effect (chỉ chạy
  // lại khi pageIdsKey đổi, xem effect bên dưới) mà không phải reconnect
  // socket mỗi khi cấu hình AI đổi.
  const aiAssistantSettingsRef = React.useRef(aiAssistantSettings);
  React.useEffect(() => {
    aiAssistantSettingsRef.current = aiAssistantSettings;
  }, [aiAssistantSettings]);
  // Bấm chọn hội thoại khác trong lúc 1 lượt sinh gợi ý cũ chưa xong -> chỉ
  // áp dụng kết quả của lượt MỚI NHẤT, giống cơ chế tagRequestSeqRef ở trên.
  const aiSuggestionsRequestIdRef = React.useRef(0);

  async function fetchAiSuggestions(conversationId: string) {
    if (!aiAssistantSettingsRef.current?.suggestReplyEnabled) return;
    const requestId = ++aiSuggestionsRequestIdRef.current;
    setAiSuggestionsLoading(true);
    setAiSuggestions([]);
    const result = await generateAiSuggestions(conversationId);
    if (aiSuggestionsRequestIdRef.current !== requestId) return;
    setAiSuggestionsLoading(false);
    if (!("error" in result)) {
      setAiSuggestions(result.suggestions);
    }
  }

  React.useEffect(() => {
    // auth dạng HÀM (không phải object tĩnh) — socket.io-client tự gọi lại
    // hàm này ở MỌI lần thử kết nối, kể cả các lần tự động reconnect sau khi
    // rớt mạng, không chỉ lần đầu. Bắt buộc phải vậy vì vé chỉ sống 60s (xem
    // server/src/utils/jwt.ts#signSocketTicket) — trước đây lấy vé 1 lần rồi
    // nhét cứng vào object, nên mọi lần reconnect sau phút đầu tiên đều gửi
    // lại vé đã hết hạn và bị server từ chối thẳng, khiến auto-reconnect của
    // thư viện tồn tại trên danh nghĩa nhưng chưa từng thành công thật sự.
    const socket: Socket = io(process.env.NEXT_PUBLIC_SOCKET_URL, {
      auth: async (cb) => {
        const ticket = await getSocketTicket();
        cb({ ticket: ticket ?? "" });
      },
    });

    socket.on("connect", () => {
      for (const id of pageIds) {
        socket.emit("join_page", id);
      }
    });

    // Chỉ log để còn thấy trong console lúc debug — không toast, vì rớt
    // mạng thoáng qua (đổi wifi, laptop ngủ...) là chuyện bình thường, tự
    // reconnect ngầm được rồi (nay đã sửa), không cần làm phiền người dùng
    // mỗi lần.
    socket.on("connect_error", (err) => {
      console.error("Lỗi kết nối socket:", err.message);
    });

    socket.on("new_message", (payload: NewMessageEvent) => {
      // Phát âm thanh cho MỌI tin nhắn khách gửi tới (kể cả hội thoại đang
      // mở sẵn) — khác toast (chỉ báo khi KHÔNG mở sẵn, xem bên dưới), vì
      // âm thanh không gây rối màn hình như toast. .catch() bỏ qua lỗi
      // NotAllowedError nếu trình duyệt chặn autoplay do chưa có tương tác
      // nào của người dùng trong trang.
      if (payload.message.sender === "customer") {
        notificationSoundRef.current?.play().catch(() => {});
      }

      const { kind, text, attachmentUrls } = messageKindAndContent(
        payload.message.text,
        payload.message.attachments
      );
      const newMessage: ConversationMessage = {
        id: payload.message.id,
        sender: payload.message.sender,
        kind,
        text,
        attachmentUrls,
        senderName: payload.message.senderName,
        senderAvatarUrl: payload.message.senderAvatarUrl,
        replyPreviewText: payload.message.replyPreviewText,
        time: formatClock(payload.message.createdAt),
        createdAt: payload.message.createdAt,
      };

      setConversations((prev) => {
        const index = prev.findIndex((c) => c.id === payload.conversationId);

        if (index === -1) {
          const newConversation: Conversation = {
            id: payload.conversation.id,
            pageId: payload.conversation.pageId,
            type: payload.conversation.type,
            customerName: payload.conversation.customerName || "Khách hàng",
            customerAvatarUrl: payload.conversation.customerAvatarUrl,
            isGroup: payload.conversation.isGroup,
            // Hội thoại mới toanh chưa thể có thẻ gì — tags chỉ được gán
            // qua thao tác thủ công trong QuickTagBar, không phải qua
            // socket "new_message" (không liên quan tới việc gửi/nhận tin).
            tags: [],
            lastSeenLabel: "",
            timeLabel: formatTimeLabel(payload.conversation.lastMessageAt),
            isRead: false,
            hasMoreMessages: false,
            messages: [newMessage],
          };
          return [newConversation, ...prev];
        }

        const conversation = prev[index];
        // Echo của chính tin mình vừa gửi — đã hiện optimistic (và tự
        // chuyển "sent") ở handleSend rồi, bỏ qua không thêm trùng. So theo
        // `clientId` (KHÔNG phải `id` — đã đổi sang id thật ngay khi có phản
        // hồi từ server, xem handleSend) để vẫn nhận ra đúng tin dù `id` đã
        // đổi từ lúc đó.
        if (
          payload.message.clientId &&
          conversation.messages.some((m) => m.clientId === payload.message.clientId)
        ) {
          return prev;
        }

        const isActive = payload.conversationId === activeIdRef.current;
        const updated = { ...conversation };
        updated.messages = [...updated.messages, newMessage];
        updated.timeLabel = formatTimeLabel(payload.conversation.lastMessageAt);
        updated.isRead = isActive;

        const rest = prev.filter((_, i) => i !== index);
        return [updated, ...rest];
      });

      if (payload.conversationId === activeIdRef.current) {
        void markConversationRead(payload.conversationId);
        // "Khi khách nhắn tin"/"Luôn gợi ý" -> sinh lại gợi ý mỗi khi khách
        // gửi tin mới vào đúng hội thoại đang mở; "Khi mở hội thoại" chỉ
        // sinh 1 lần lúc chọn hội thoại (xem handleSelect), "Thủ công"
        // không tự sinh lúc nào cả (chỉ qua nút trong AiSuggestionBar).
        if (
          payload.message.sender === "customer" &&
          aiAssistantSettingsRef.current?.suggestReplyEnabled &&
          (aiAssistantSettingsRef.current?.suggestReplyTrigger === "on_message" ||
            aiAssistantSettingsRef.current?.suggestReplyTrigger === "always")
        ) {
          void fetchAiSuggestions(payload.conversationId);
        }
      } else if (payload.message.sender === "customer") {
        // Chỉ báo toast cho tin của KHÁCH (không phải echo tin mình gửi) và
        // KHÔNG phải hội thoại đang mở sẵn (đỡ làm phiền khi đang xem đúng
        // hội thoại đó rồi) — bấm vào toast để mở thẳng hội thoại.
        const conversationId = payload.conversationId;
        toast({
          title: payload.message.senderName || payload.conversation.customerName || "Khách hàng",
          description: messagePreviewText(payload.message.text, payload.message.attachments),
          avatarUrl: payload.message.senderAvatarUrl || payload.conversation.customerAvatarUrl,
          onClick: () => handleSelect(conversationId),
        });
      }
    });

    // Đồng bộ reaction agent vừa thả/gỡ ở tab/phiên khác đang mở cùng hội
    // thoại (xem emitMessageReaction trong realtime/socket.ts) — bản thân
    // tab vừa thả cũng nhận lại đúng event này, không sao vì set cùng 1 giá
    // trị lại (idempotent), không cần lọc self-echo như new_message.
    socket.on("message_reaction", (payload: MessageReactionEvent) => {
      setConversations((prev) =>
        prev.map((c) =>
          c.id === payload.conversationId
            ? {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === payload.messageId ? { ...m, reactionIcon: payload.reactionIcon } : m
                ),
              }
            : c
        )
      );
    });

    return () => {
      socket.disconnect();
    };
    // Chỉ reconnect khi tập hợp id thực sự đổi (so theo pageIdsKey) — dùng
    // trực tiếp mảng pageIds bên trong effect để join, không đưa nó vào
    // dependency (mảng luôn là instance mới mỗi render).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageIdsKey]);

  function handleSelect(id: string) {
    setActiveId(id);
    setReplyingTo(null);
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, isRead: true } : c)));
    void markConversationRead(id);

    const trigger = aiAssistantSettingsRef.current?.suggestReplyTrigger;
    if (trigger === "on_open" || trigger === "always") {
      void fetchAiSuggestions(id);
    } else {
      // "Khi khách nhắn tin" chỉ tự sinh khi có tin MỚI từ khách (xem
      // socket handler "new_message" bên dưới), không phải lúc mở hội
      // thoại; "Thủ công" chỉ sinh khi tự bấm nút — cả 2 đều KHÔNG tự sinh
      // ở đây. Vẫn phải xoá gợi ý của hội thoại TRƯỚC đó, tránh hiện nhầm
      // gợi ý cũ khi vừa chuyển sang.
      aiSuggestionsRequestIdRef.current += 1;
      setAiSuggestions([]);
      setAiSuggestionsLoading(false);
    }
  }

  // Hiện ngay các tin "đang gửi" (optimistic) bằng clientId tự sinh — khi tin
  // thật dội về qua socket, handler ở trên sẽ nhận ra (khớp clientId) và bỏ
  // qua, không thêm trùng. Ở đây chỉ cần tự đổi trạng thái sending -> sent
  // /failed dựa theo kết quả gọi API.
  //
  // text và imageUrls là 2 tin nhắn RIÊNG BIỆT nếu cả 2 cùng có — nhưng nếu
  // chọn nhiều ảnh, cả nhóm ảnh đó gộp chung 1 tin (message.attachments dạng
  // mảng của Facebook), không tách thành nhiều tin/bong bóng riêng.
  async function handleSend(
    text: string,
    imageUrls: string[],
    replyToMessageId?: string,
    file?: { url: string; name: string; isVideo?: boolean }
  ) {
    if (!activeConversation) return;
    const conversationId = activeConversation.id;
    const now = new Date().toISOString();

    const parts: {
      clientId: string;
      text?: string;
      imageUrls?: string[];
      fileUrl?: string;
      fileName?: string;
      isVideo?: boolean;
      replyToMessageId?: string;
    }[] = [];
    if (text) parts.push({ clientId: `temp-${crypto.randomUUID()}`, text, replyToMessageId });
    if (imageUrls.length > 0) parts.push({ clientId: `temp-${crypto.randomUUID()}`, imageUrls });
    if (file) {
      parts.push({
        clientId: `temp-${crypto.randomUUID()}`,
        fileUrl: file.url,
        fileName: file.name,
        isVideo: file.isVideo,
      });
    }
    if (parts.length === 0) return;

    // Vừa gửi tin thì gợi ý đang hiện (nếu có) đã lỗi thời — xoá ngay, huỷ
    // luôn lượt fetch nào đang dở (vd đang loading do "manual"/"on_open")
    // để nó không tự hiện lại đè lên sau khi resolve.
    aiSuggestionsRequestIdRef.current += 1;
    setAiSuggestions([]);
    setAiSuggestionsLoading(false);

    const optimisticMessages: ConversationMessage[] = parts.map((part) => ({
      id: part.clientId,
      // Giữ riêng clientId (không đổi, khác `id` sẽ được cập nhật sang id
      // thật ngay khi server phản hồi) — cần cho chống trùng echo socket VÀ
      // đối chiếu reaction khách thả vào đúng tin thật sau này.
      clientId: part.clientId,
      sender: "page",
      kind: part.imageUrls ? "image" : part.fileUrl ? (part.isVideo ? "video" : "file") : "text",
      text: part.fileUrl ? part.fileName : part.text,
      attachmentUrls: part.imageUrls ?? (part.fileUrl ? [part.fileUrl] : undefined),
      time: formatClock(now),
      createdAt: now,
      status: "sending",
    }));

    setConversations((prev) => {
      const index = prev.findIndex((c) => c.id === conversationId);
      if (index === -1) return prev;
      const updated = { ...prev[index], messages: [...prev[index].messages, ...optimisticMessages] };
      const rest = prev.filter((_, i) => i !== index);
      return [updated, ...rest];
    });

    const result = await sendMessage(conversationId, parts);

    if ("error" in result) {
      toast.error(result.error);
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversationId
            ? {
                ...c,
                messages: c.messages.map((m) =>
                  parts.some((p) => p.clientId === m.clientId) ? { ...m, status: "failed" } : m
                ),
              }
            : c
        )
      );
      return;
    }

    // Đổi `id` sang id thật của server (giữ nguyên `clientId` không đổi) —
    // cần để sau này reaction khách thả vào ĐÚNG tin vừa gửi này còn đối
    // chiếu được (emitMessageReaction gửi id thật, không phải clientId, xem
    // zaloSession.manager.ts). Cơ chế chống trùng echo socket vẫn hoạt động
    // đúng vì đã so theo `clientId` (không đổi), không so theo `id` nữa (xem
    // effect kết nối socket phía trên). Merge thêm field chỉ server mới tính
    // được — replyPreviewText là ví dụ điển hình, thiếu bước này thì khung
    // trích dẫn "Trả lời" chỉ hiện đúng sau khi F5.
    const resultByClientId = new Map(result.results.map((r) => [r.clientId, r]));

    setConversations((prev) =>
      prev.map((c) =>
        c.id === conversationId
          ? {
              ...c,
              messages: c.messages.map((m) => {
                const r = m.clientId ? resultByClientId.get(m.clientId) : undefined;
                if (!r) return m;
                return {
                  ...m,
                  id: r.message?.id ?? m.id,
                  status: r.error ? "failed" : "sent",
                  replyPreviewText: r.message?.replyPreviewText ?? m.replyPreviewText,
                };
              }),
            }
          : c
      )
    );

    result.results.forEach((r) => {
      if (r.error) toast.error(r.error);
    });
  }

  // Thả (hoặc gỡ, icon="NONE") icon vào 1 tin của khách — optimistic giống
  // handleToggleTag, tự lùi lại nếu API lỗi. Không cần request-sequence guard
  // như tag (chỉ 1 icon/lần, không có thao tác dồn dập liên tiếp trên cùng 1
  // tin để mà bị lệch thứ tự).
  async function handleReact(messageId: string, icon: string) {
    if (!activeConversation) return;
    const conversationId = activeConversation.id;
    const previous = activeConversation.messages.find((m) => m.id === messageId)?.reactionIcon;

    setConversations((prev) =>
      prev.map((c) =>
        c.id === conversationId
          ? {
              ...c,
              messages: c.messages.map((m) =>
                m.id === messageId ? { ...m, reactionIcon: icon === "NONE" ? undefined : icon } : m
              ),
            }
          : c
      )
    );

    const result = await reactToMessage(conversationId, messageId, icon);
    if ("error" in result) {
      toast.error(result.error);
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversationId
            ? {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === messageId ? { ...m, reactionIcon: previous } : m
                ),
              }
            : c
        )
      );
    }
  }

  // Tải thêm tin nhắn cũ hơn khi cuộn lên đầu khung chat — cursor lấy từ
  // tin nhắn cũ nhất ĐANG có ở client (đầu mảng messages).
  async function handleLoadMoreMessages(conversationId: string) {
    const conversation = conversations.find((c) => c.id === conversationId);
    if (!conversation || conversation.messages.length === 0) return;

    const oldest = conversation.messages[0];
    const { messages: olderMessages, hasMore } = await getOlderMessages(
      conversationId,
      oldest.createdAt,
      oldest.id
    );

    setConversations((prev) =>
      prev.map((c) =>
        c.id === conversationId
          ? { ...c, messages: [...olderMessages, ...c.messages], hasMoreMessages: hasMore }
          : c
      )
    );
  }

  // Bật/tắt 1 thẻ cho hội thoại đang mở — cập nhật UI (QuickTagBar +
  // badge dưới ConversationList) NGAY, không đợi API xong mới hiện (optimistic),
  // rồi mới gọi setConversationTags chạy nền. Lỗi thì tự lùi lại trạng thái cũ.
  async function handleToggleTag(tagId: string) {
    if (!activeConversation) return;
    const conversationId = activeConversation.id;
    const tagInCatalog = conversationTags?.find((t) => t.id === tagId);
    if (!tagInCatalog) return;

    const previousTags = activeConversation.tags;
    const hasTag = previousTags.some((t) => t.id === tagId);
    const optimisticTags = hasTag
      ? previousTags.filter((t) => t.id !== tagId)
      : [...previousTags, tagInCatalog];

    setConversations((prev) =>
      prev.map((c) => (c.id === conversationId ? { ...c, tags: optimisticTags } : c))
    );

    const requestId = (tagRequestSeqRef.current.get(conversationId) ?? 0) + 1;
    tagRequestSeqRef.current.set(conversationId, requestId);

    const result = await setConversationTags(
      conversationId,
      optimisticTags.map((t) => t.id)
    );

    // Đã có request MỚI HƠN cho đúng hội thoại này chạy sau request này (bấm
    // thẻ khác trong lúc đang đợi) — bỏ qua kết quả, dù đến sau hay đến
    // trước request kia, để không đè lên trạng thái mới hơn đang hiện.
    if (tagRequestSeqRef.current.get(conversationId) !== requestId) return;

    if ("error" in result) {
      toast.error(result.error);
      setConversations((prev) =>
        prev.map((c) => (c.id === conversationId ? { ...c, tags: previousTags } : c))
      );
      return;
    }

    // Đồng bộ lại với dữ liệu thật từ server (phòng trường hợp tagId gửi lên
    // bị backend lọc bỏ, vd id lạ/không thuộc Shop).
    setConversations((prev) =>
      prev.map((c) => (c.id === conversationId ? { ...c, tags: result.tags } : c))
    );
  }

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <InboxIconRail className="!bg-none bg-transparent border-none" />

        <div className="relative flex flex-1 min-w-0 bg-white rounded-tl-xl overflow-hidden">
          <ConversationList
            conversations={conversations}
            activeId={activeId}
            search={search}
            onSearchChange={setSearch}
            onSelect={handleSelect}
            pagesById={pagesById}
          />

          {activeConversation ? (
            <div className={cn("flex min-w-0 flex-1 flex-col h-full", !activeId && "hidden md:flex")}>
              <ChatHeader
                conversation={activeConversation}
                onBack={() => setActiveId(null)}
                onToggleCustomerInfo={() => setShowCustomerInfo((v) => !v)}
                showCustomerInfo={showCustomerInfo}
              />
              <MessageThread
                messages={activeConversation.messages}
                customerName={activeConversation.customerName}
                customerAvatarUrl={activeConversation.customerAvatarUrl}
                hasMoreMessages={activeConversation.hasMoreMessages}
                onLoadMore={() => handleLoadMoreMessages(activeConversation.id)}
                channelType={activeConversation.type}
                onReply={setReplyingTo}
                onReact={handleReact}
              />
              <QuickTagBar
                tags={conversationTags ?? []}
                activeTagIds={activeConversation.tags.map((t) => t.id)}
                onToggleTag={handleToggleTag}
              />
              {aiAssistantSettings?.suggestReplyEnabled && (
                <AiSuggestionBar
                  suggestions={aiSuggestions}
                  loading={aiSuggestionsLoading}
                  onSelect={(text) => composerRef.current?.setText(text)}
                  manual={aiAssistantSettings.suggestReplyTrigger === "manual"}
                  onRequest={() => fetchAiSuggestions(activeConversation.id)}
                />
              )}
              <MessageComposer
                ref={composerRef}
                onSend={handleSend}
                quickReplies={quickReplies ?? []}
                replyingTo={replyingTo}
                onCancelReply={() => setReplyingTo(null)}
              />
            </div>
          ) : (
            <div className="hidden md:flex flex-1 flex-col items-center justify-center gap-2 text-slate-400">
              <BsChatSquareTextFill className="h-10 w-10" />
              <p className="text-sm">Xin chọn 1 hội thoại từ danh sách bên trái</p>
            </div>
          )}

          {/* Customer info panel on Desktop (md screen size and above) */}
          <CustomerInfoPanel
            hasActiveConversation={!!activeConversation}
            className="hidden md:flex"
          />

          {/* Customer info drawer overlay on Mobile ONLY (< md screen size) */}
          {showCustomerInfo && (
            <div className="fixed inset-0 z-50 flex justify-end md:hidden">
              <div
                className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
                onClick={() => setShowCustomerInfo(false)}
              />
              <div className="relative z-10 w-full max-w-xs sm:max-w-sm h-full bg-white shadow-2xl animate-in slide-in-from-right duration-200">
                <CustomerInfoPanel
                  hasActiveConversation={!!activeConversation}
                  onClose={() => setShowCustomerInfo(false)}
                />
              </div>
            </div>
          )}
        </div>
      </div>
  );
}
