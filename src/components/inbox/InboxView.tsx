"use client";

import * as React from "react";
import { io, type Socket } from "socket.io-client";
import { BsChatSquareTextFill } from "react-icons/bs";
import { generateAiSuggestions } from "@/app/actions/aiAssistant";
import {
  getMoreConversations,
  getOlderMessages,
  markConversationRead,
  reactToMessage,
  searchConversations,
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
import { MessageThread, ZALO_CHANNEL_TYPE, type ReplyTarget } from "./MessageThread";
import { QuickTagBar } from "./QuickTagBar";
import { AiSuggestionBar } from "./AiSuggestionBar";
import { MessageComposer, type MessageComposerHandle } from "./MessageComposer";
import { CustomerInfoPanel } from "./CustomerInfoPanel";
import type { ZaloPageOption } from "./ZaloPageSelect";

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
    attachments?: { type: string; url: string; name?: string; description?: string; thumb?: string }[];
    // Khách trong nhóm (sender="customer") hoặc tên nhân viên đã gửi
    // (sender="page", server resolve từ Message.sentBy) — xem MessageThread.tsx.
    senderName?: string;
    senderAvatarUrl?: string;
    // Tin do chatbot tự động gửi — xem types/conversation.ts#ConversationMessage.sentByBot.
    sentByBot?: boolean;
    // Snippet khung trích dẫn nếu tin này LÀ 1 lời trả lời — xem
    // message.model.ts#replyPreviewText.
    replyPreviewText?: string;
    replyToMessageId?: string;
    // "@nhắc tên" thành viên nhóm (chỉ Zalo nhóm) — xem
    // message.model.ts#mentions.
    mentions?: { uid: string; pos: number; len: number }[];
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

import LivechatLoading from "@/app/(app)/livechat/loading";

interface InboxViewProps {
  bot: Bot;
  // Promise tải danh sách hội thoại từ server (chạy song song qua React
  // Suspense) — luôn truyền, kể cả lúc chưa có Page nào (Promise.resolve()
  // rỗng, xem livechat/page.tsx) để InboxViewInner không cần biết case rỗng.
  conversationsPromise: Promise<{ conversations: Conversation[]; hasMore: boolean }>;
  // Danh sách Page thật cần join room realtime — mặc định chỉ [bot.id].
  // Truyền nhiều id khi đang xem gộp tạm thời nhiều Page cùng lúc.
  socketPageIds?: string[];
  // Tra cứu tên + avatar Page theo pageId — chỉ cần truyền khi xem gộp nhiều
  // Page, để hiện rõ mỗi hội thoại thuộc Page nào.
  pagesById?: Record<string, { name: string; avatarUrl?: string }>;
  // Page Zalo cá nhân đang kết nối — cho nút "+" (Danh sách bạn bè/Kết bạn)
  // trong ConversationList, xem ZaloAddFriendModal/ZaloFriendListModal.
  zaloPages?: ZaloPageOption[];
  // Mẫu trả lời nhanh của Shop — gõ ký tự tắt trong khung soạn tin để chèn
  // nhanh (xem MessageComposer). Snapshot lúc tải trang, không tự đồng bộ
  // real-time nếu sửa ở Cài đặt trong lúc đang mở sẵn Livechat ở tab khác.
  quickRepliesPromise: Promise<QuickReply[]>;
  // Danh mục thẻ hội thoại của Shop (xem /settings/tags) — QuickTagBar hiện
  // hết danh mục này, đánh dấu thẻ nào đang gắn cho hội thoại đang mở.
  conversationTagsPromise: Promise<ConversationTag[]>;
  // Cấu hình "Gợi ý trả lời tin nhắn từ AI" (xem /settings/ai-assistant) —
  // quyết định có tự gọi sinh gợi ý không, và khi nào (mở hội thoại, hay
  // mỗi tin mới), xem effect gọi generateAiSuggestions bên dưới.
  aiAssistantSettingsPromise: Promise<AiAssistantSettings>;
}

export function InboxView(props: InboxViewProps) {
  return (
    <React.Suspense fallback={<LivechatLoading />}>
      <InboxViewInner {...props} />
    </React.Suspense>
  );
}

function InboxViewInner({
  bot,
  conversationsPromise,
  socketPageIds,
  pagesById,
  zaloPages,
  quickRepliesPromise,
  conversationTagsPromise,
  aiAssistantSettingsPromise,
}: InboxViewProps) {
  // Giải mã Promise dữ liệu song song qua React 19 `use()` API — chỉ 1 nguồn
  // duy nhất (Promise), không còn nhánh giá trị trực tiếp cũ (không có caller
  // nào dùng tới nữa từ khi livechat/page.tsx chuyển hẳn sang Suspense).
  const initialData = React.use(conversationsPromise);
  const quickReplies = React.use(quickRepliesPromise);
  const conversationTags = React.use(conversationTagsPromise);
  const aiAssistantSettings = React.use(aiAssistantSettingsPromise);

  const [conversations, setConversations] = React.useState<Conversation[]>(initialData.conversations);
  const [hasMoreConversations, setHasMoreConversations] = React.useState(initialData.hasMore);
  const [isLoadingMoreConversations, setIsLoadingMoreConversations] = React.useState(false);
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");
  // null = không đang tìm kiếm (hiện `conversations` bình thường) — khác
  // mảng rỗng (đang tìm kiếm nhưng không ra kết quả nào). Tách biệt hoàn
  // toàn khỏi `conversations`, xem effect debounce bên dưới.
  const [searchResults, setSearchResults] = React.useState<Conversation[] | null>(null);
  const [isSearching, setIsSearching] = React.useState(false);
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

  // Tìm hội thoại theo tên khách — debounce 400ms sau khi ngừng gõ mới gọi
  // API (tránh gọi liên tục theo từng ký tự), tìm xuyên suốt TOÀN BỘ hội
  // thoại của các Page đang xem chứ không chỉ trong số đã tải sẵn. Dùng hàm
  // xử lý sự kiện thường (không phải useEffect) — chỉ chạy đúng lúc người
  // dùng thật sự gõ, không chạy dư 1 lần lúc mount như effect theo dõi
  // `search` sẽ bị.
  const searchDebounceTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchRequestIdRef = React.useRef(0);

  function handleSearchChange(value: string) {
    setSearch(value);
    if (searchDebounceTimerRef.current) clearTimeout(searchDebounceTimerRef.current);

    if (!value.trim()) {
      // Xóa hết ô tìm kiếm — thoát tìm kiếm NGAY (không chờ debounce), tải
      // lại đúng trang đầu để nạp sạch `conversations` (đơn giản hơn tự ghép
      // lại state cũ ở client).
      setSearchResults(null);
      setIsSearching(false);
      const requestId = ++searchRequestIdRef.current;
      void (async () => {
        const { conversations: fresh, hasMore } = await getMoreConversations(pageIds);
        if (searchRequestIdRef.current !== requestId) return;
        setConversations((prev) => {
          // Trang đầu mới tải có thể KHÔNG chứa hội thoại đang mở chat dở
          // (VD: vừa mở từ kết quả tìm kiếm, hoặc lâu rồi khách đó không
          // nhắn nên rơi khỏi top N mới nhất) — giữ lại đúng hội thoại đó
          // (từ state TRƯỚC khi nạp lại) để không "mất" hội thoại đang xem
          // giữa chừng.
          if (!activeId || fresh.some((c) => c.id === activeId)) return fresh;
          const stillActive = prev.find((c) => c.id === activeId);
          return stillActive ? [stillActive, ...fresh] : fresh;
        });
        setHasMoreConversations(hasMore);
      })();
      return;
    }

    setIsSearching(true);
    const requestId = ++searchRequestIdRef.current;
    searchDebounceTimerRef.current = setTimeout(() => {
      void (async () => {
        const { conversations: results } = await searchConversations(pageIds, value);
        // Bị request mới hơn (gõ tiếp sau đó, hoặc đã xóa hết ô tìm kiếm)
        // vượt mặt — bỏ qua kết quả trả về muộn này, tránh ghi đè nhầm lên
        // trạng thái đúng hơn.
        if (searchRequestIdRef.current !== requestId) return;
        setSearchResults(results);
        setIsSearching(false);
      })();
    }, 400);
  }

  // Âm thanh báo tin nhắn mới — tạo 1 lần, phát lại (không tạo mới mỗi lần)
  // để không phải tải lại file mỗi khi có tin đến.
  const notificationSoundRef = React.useRef<HTMLAudioElement | null>(null);
  React.useEffect(() => {
    notificationSoundRef.current = new Audio("/nhachchat.mp3");
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
        notificationSoundRef.current?.play().catch(() => { });
      }

      const { kind, text, attachmentUrls, linkPreview } = messageKindAndContent(
        payload.message.text,
        payload.message.attachments
      );
      const newMessage: ConversationMessage = {
        id: payload.message.id,
        sender: payload.message.sender,
        kind,
        text,
        attachmentUrls,
        linkPreview,
        senderName: payload.message.senderName,
        senderAvatarUrl: payload.message.senderAvatarUrl,
        sentByBot: payload.message.sentByBot,
        replyPreviewText: payload.message.replyPreviewText,
        replyToMessageId: payload.message.replyToMessageId,
        mentions: payload.message.mentions,
        time: formatClock(payload.message.createdAt),
        createdAt: payload.message.createdAt,
      };

      let isNewlyDiscovered = false;

      setConversations((prev) => {
        const index = prev.findIndex((c) => c.id === payload.conversationId);

        if (index === -1) {
          // Nhánh này chạy cho CẢ 2 trường hợp: khách nhắn lần đầu (hội
          // thoại thật sự mới), LẪN 1 hội thoại đã có từ trước nhưng chưa
          // được tải vào danh sách (nằm ở trang sau, do danh sách hội thoại
          // giờ phân trang — xem getConversationsForPages). Không phân biệt
          // được 2 case này chỉ từ payload socket, nên mặc định
          // hasMoreMessages:true (an toàn hơn: sai với case "mới thật" chỉ
          // tốn 1 lượt gọi API tải thêm trả về rỗng, còn để false mà sai với
          // case "hội thoại cũ" sẽ mất khả năng xem lại lịch sử tin nhắn).
          // Vừa dựng xong chỉ có ĐÚNG 1 tin (tin vừa tới) — nếu đây thực ra
          // là hội thoại cũ, lịch sử tin nhắn trước đó sẽ tự tải ngầm ngay
          // bên dưới (isNewlyDiscovered), không bắt người dùng phải tự cuộn
          // lên hay F5 mới thấy.
          isNewlyDiscovered = true;
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
            lastMessageAt: payload.conversation.lastMessageAt,
            isRead: false,
            hasMoreMessages: true,
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
        updated.lastMessageAt = payload.conversation.lastMessageAt;
        updated.isRead = isActive;

        const rest = prev.filter((_, i) => i !== index);
        return [updated, ...rest];
      });

      if (isNewlyDiscovered) {
        // Tải ngầm lịch sử tin nhắn cũ hơn ngay (cursor = chính tin vừa
        // dựng, vì đây là tin DUY NHẤT đang có trong hội thoại giả lập ở
        // trên) — để nếu đây là khách cũ, mở hội thoại lên là thấy đủ ngữ
        // cảnh luôn, không cần tự cuộn lên hay F5. Nếu đúng là khách nhắn
        // lần đầu thật, gọi API chỉ trả về mảng rỗng, vô hại.
        void getOlderMessages(payload.conversationId, newMessage.createdAt, newMessage.id).then(
          ({ messages: olderMessages, hasMore }) => {
            if (olderMessages.length === 0) {
              setConversations((prev) =>
                prev.map((c) =>
                  c.id === payload.conversationId ? { ...c, hasMoreMessages: hasMore } : c
                )
              );
              return;
            }
            setConversations((prev) =>
              prev.map((c) =>
                c.id === payload.conversationId
                  ? { ...c, messages: [...olderMessages, ...c.messages], hasMoreMessages: hasMore }
                  : c
              )
            );
          }
        );
      }

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
          isMessage: true,
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
    setConversations((prev) => {
      if (prev.some((c) => c.id === id)) {
        return prev.map((c) => (c.id === id ? { ...c, isRead: true } : c));
      }
      // Hội thoại chỉ có trong searchResults, chưa từng nằm trong
      // `conversations` (VD: nằm ở "trang sau" chưa cuộn tới, tìm ra qua ô
      // tìm kiếm) — "thăng cấp" vào conversations ngay khi mở, để mọi thao
      // tác sau đó (gửi tin, thả tag, reaction, tải thêm tin cũ...) đều tìm
      // thấy đúng qua conversations.find như bình thường, không phải sửa lại
      // từng chỗ để biết tới searchResults.
      const fromSearch = searchResults?.find((c) => c.id === id);
      return fromSearch ? [{ ...fromSearch, isRead: true }, ...prev] : prev;
    });
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

  // Đánh dấu lại 1 hội thoại thành ĐÃ/CHƯA đọc — tự bấm từ menu chuột phải
  // trong ConversationList.tsx (khác handleSelect ở trên, vốn LUÔN đánh dấu
  // đã đọc vì đang thật sự mở xem). Cập nhật lạc quan trước (UI phản hồi tức
  // thì), rollback nếu server báo lỗi.
  function handleToggleRead(id: string, isRead: boolean) {
    let previous: boolean | undefined;
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        previous = c.isRead;
        return { ...c, isRead };
      })
    );
    void markConversationRead(id, isRead).then((result) => {
      if (result?.error) {
        toast.error(result.error);
        if (previous !== undefined) {
          setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, isRead: previous! } : c)));
        }
      }
    });
  }

  // Bấm "Nhắn tin" cạnh 1 người trong danh sách bạn bè Zalo (xem
  // ZaloFriendListModal) — conversationId có thể là hội thoại ĐÃ CÓ (backend
  // tìm-hoặc-tạo, xem zaloFriend.controller.ts#openZaloConversation) nên
  // luôn tải lại lịch sử tin nhắn thật ngay sau khi mở, không tin vào
  // placeholder rỗng vừa dựng (mirror cách "isNewlyDiscovered" ở socket
  // handler phía trên đang làm cho trường hợp tương tự).
  async function handleOpenZaloConversation(
    conversationId: string,
    preview: { name: string; avatarUrl?: string; pageId: string }
  ) {
    setConversations((prev) => {
      if (prev.some((c) => c.id === conversationId)) return prev;
      const placeholder: Conversation = {
        id: conversationId,
        pageId: preview.pageId,
        // 1 = CHANNEL_TYPE_ZALO_PERSONAL (server/src/models/connectedPage.model.ts)
        // — chỉ Zalo mới có danh sách bạn bè, không cần đọc động từ đâu khác.
        type: 1,
        customerName: preview.name,
        customerAvatarUrl: preview.avatarUrl,
        isGroup: false,
        tags: [],
        lastSeenLabel: "",
        timeLabel: formatTimeLabel(new Date().toISOString()),
        lastMessageAt: new Date().toISOString(),
        isRead: true,
        hasMoreMessages: true,
        messages: [],
      };
      return [placeholder, ...prev];
    });

    handleSelect(conversationId);

    const { messages, hasMore } = await getOlderMessages(conversationId);
    setConversations((prev) =>
      prev.map((c) => (c.id === conversationId ? { ...c, messages, hasMoreMessages: hasMore } : c))
    );
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
    file?: { url: string; name: string; isVideo?: boolean },
    sticker?: { id: number; cateId: number; type: number; previewUrl: string },
    mentions?: { uid: string; pos: number; len: number }[]
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
      sticker?: { id: number; cateId: number; type: number };
      mentions?: { uid: string; pos: number; len: number }[];
      // Chỉ optimistic UI dùng (hiện ảnh preview NGAY, trước khi server xác
      // nhận) — KHÔNG gửi lên server (server tự tra lại URL thật qua API
      // Zalo, xem sendSticker ở zalo.channel.ts — không tin URL client khai).
      stickerPreviewUrl?: string;
    }[] = [];
    if (text) parts.push({ clientId: `temp-${crypto.randomUUID()}`, text, replyToMessageId, mentions });
    if (imageUrls.length > 0) parts.push({ clientId: `temp-${crypto.randomUUID()}`, imageUrls });
    if (file) {
      parts.push({
        clientId: `temp-${crypto.randomUUID()}`,
        fileUrl: file.url,
        fileName: file.name,
        isVideo: file.isVideo,
      });
    }
    if (sticker) {
      parts.push({
        clientId: `temp-${crypto.randomUUID()}`,
        sticker: { id: sticker.id, cateId: sticker.cateId, type: sticker.type },
        stickerPreviewUrl: sticker.previewUrl,
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
      kind: part.imageUrls
        ? "image"
        : part.fileUrl
          ? part.isVideo
            ? "video"
            : "file"
          : part.sticker
            ? "sticker"
            : "text",
      // Video "thật" nhúng trực tiếp trong khung chat — KHÔNG hiện tên file
      // đè bên dưới (giống ảnh/sticker), khác file thường vẫn cần tên để
      // hiện trên thẻ link "bấm mở tab mới" (xem messageKindAndContent).
      text: part.fileUrl ? (part.isVideo ? undefined : part.fileName) : part.text,
      mentions: part.mentions,
      attachmentUrls:
        part.imageUrls ??
        (part.fileUrl ? [part.fileUrl] : part.stickerPreviewUrl ? [part.stickerPreviewUrl] : undefined),
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
                replyToMessageId: r.message?.replyToMessageId ?? m.replyToMessageId,
                mentions: r.message?.mentions ?? m.mentions,
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

  // Tải thêm hội thoại cũ hơn khi cuộn xuống cuối danh sách hội thoại —
  // cursor lấy từ hội thoại CUỐI CÙNG đang có ở client (cuối mảng
  // conversations, vì mảng luôn sort mới nhất trước). Nối vào CUỐI mảng
  // (không cần khôi phục vị trí cuộn như handleLoadMoreMessages, vì thêm vào
  // cuối không làm nội dung đang xem bị dịch chuyển).
  async function handleLoadMoreConversations() {
    if (!hasMoreConversations || isLoadingMoreConversations || conversations.length === 0) return;

    const oldest = conversations[conversations.length - 1];
    setIsLoadingMoreConversations(true);
    try {
      const { conversations: more, hasMore } = await getMoreConversations(
        pageIds,
        oldest.lastMessageAt,
        oldest.id
      );
      setConversations((prev) => {
        // Lọc bỏ hội thoại đã có sẵn trong `prev` — có thể trùng với trang
        // vừa tải nếu trước đó đã "thăng cấp" 1 hội thoại từ kết quả tìm
        // kiếm lên đầu mảng (xem handleSelect), làm cursor (dựa vào hội
        // thoại CUỐI mảng) không còn khớp đúng vị trí thật của nó nữa —
        // trang sau vẫn có thể trả về đúng hội thoại đó lần nữa.
        const existingIds = new Set(prev.map((c) => c.id));
        return [...prev, ...more.filter((c) => !existingIds.has(c.id))];
      });
      setHasMoreConversations(hasMore);
    } finally {
      setIsLoadingMoreConversations(false);
    }
  }

  // Bật/tắt 1 thẻ cho hội thoại đang mở — cập nhật UI (QuickTagBar +
  // badge dưới ConversationList) NGAY, không đợi API xong mới hiện (optimistic),
  // rồi mới gọi setConversationTags chạy nền. Lỗi thì tự lùi lại trạng thái cũ.
  async function handleToggleTag(tagId: string) {
    if (!activeConversation) return;
    const conversationId = activeConversation.id;
    const tagInCatalog = conversationTags.find((t) => t.id === tagId);
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
          conversations={searchResults ?? conversations}
          activeId={activeId}
          search={search}
          onSearchChange={handleSearchChange}
          searching={isSearching}
          onSelect={handleSelect}
          pagesById={pagesById}
          zaloPages={zaloPages}
          onOpenConversation={handleOpenZaloConversation}
          hasMore={searchResults ? false : hasMoreConversations}
          onLoadMore={searchResults ? undefined : handleLoadMoreConversations}
          loadingMore={searchResults ? false : isLoadingMoreConversations}
        />

        {activeConversation ? (
          <div className={cn("flex min-w-0 flex-1 flex-col h-full", !activeId && "hidden md:flex")}>
            <ChatHeader
              conversation={activeConversation}
              onBack={() => setActiveId(null)}
              onToggleCustomerInfo={() => setShowCustomerInfo((v) => !v)}
              showCustomerInfo={showCustomerInfo}
              onToggleRead={handleToggleRead}
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
              tags={conversationTags}
              activeTagIds={activeConversation.tags.map((t) => t.id)}
              onToggleTag={handleToggleTag}
            />
            {aiAssistantSettings.suggestReplyEnabled && (
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
              quickReplies={quickReplies}
              replyingTo={replyingTo}
              onCancelReply={() => setReplyingTo(null)}
              canSendSticker={activeConversation.type === ZALO_CHANNEL_TYPE}
              zaloPageId={zaloPages?.find((p) => p.externalPageId === activeConversation.pageId)?.id}
              canMention={activeConversation.type === ZALO_CHANNEL_TYPE && activeConversation.isGroup}
              conversationId={activeConversation.id}
            />
          </div>
        ) : (
          <div className="hidden md:flex flex-1 items-center justify-center bg-[#e5ded8] p-4 text-slate-400">
            <div className="flex items-center gap-3">
              <BsChatSquareTextFill className="h-7 w-7 text-slate-400/80 shrink-0" />
              <span className="text-xl font-normal text-slate-500/80">
                Xin chọn 1 hội thoại từ danh sách bên trái
              </span>
            </div>
          </div>
        )}

        {/* Customer info panel on Desktop (md screen size and above) */}
        <CustomerInfoPanel
          hasActiveConversation={!!activeConversation}
          conversationId={activeConversation?.id}
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
                conversationId={activeConversation?.id}
                onClose={() => setShowCustomerInfo(false)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
