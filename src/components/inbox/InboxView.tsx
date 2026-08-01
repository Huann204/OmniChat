"use client";

import * as React from "react";
import { DashboardNavbar } from "@/components/dashboard/DashboardNavbar";
import { getConversationsForBot } from "@/lib/mock-conversations";
import type { Bot } from "@/types/bot";
import type { Conversation, ConversationMessage } from "@/types/conversation";
import { InboxIconRail } from "./InboxIconRail";
import { ConversationList } from "./ConversationList";
import { ChatHeader } from "./ChatHeader";
import { MessageThread } from "./MessageThread";
import { QuickTagBar } from "./QuickTagBar";
import { MessageComposer } from "./MessageComposer";
import { CustomerInfoPanel } from "./CustomerInfoPanel";

const TABS = ["Hội thoại", "Đơn hàng", "Bài viết", "Thống kê", "Cài đặt"];

interface InboxViewProps {
  bot: Bot;
  userName: string;
  userEmail: string;
}

export function InboxView({ bot, userName, userEmail }: InboxViewProps) {
  const [conversations, setConversations] = React.useState<Conversation[]>(() =>
    getConversationsForBot(bot.id)
  );
  const [activeId, setActiveId] = React.useState<string | null>(conversations[0]?.id ?? null);
  const [search, setSearch] = React.useState("");
  const [activeTab, setActiveTab] = React.useState("Hội thoại");

  const activeConversation = conversations.find((c) => c.id === activeId) ?? null;

  function handleSelect(id: string) {
    setActiveId(id);
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, isRead: true } : c)));
  }

  function handleSend(text: string) {
    if (!activeConversation) return;
    const newMessage: ConversationMessage = {
      id: `${activeConversation.id}-${Date.now()}`,
      sender: "page",
      kind: "text",
      text,
      time: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
    };
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConversation.id ? { ...c, messages: [...c.messages, newMessage] } : c
      )
    );
  }

  return (
    <div className="flex h-screen flex-col bg-gradient-to-r from-[#123B54] via-[#1B6E5C] to-[#2FA968]">
      <DashboardNavbar
        userName={userName}
        userEmail={userEmail}
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        className="!bg-none bg-transparent border-none shadow-none"
      />

      <div className="flex min-h-0 flex-1">
        <InboxIconRail className="!bg-none bg-transparent border-none" />

        <div className="flex flex-1 min-w-0 bg-white rounded-tl-xl overflow-hidden">
          <ConversationList
            conversations={conversations}
            activeId={activeId}
            search={search}
            onSearchChange={setSearch}
            onSelect={handleSelect}
          />

          {activeConversation ? (
            <div className="flex min-w-0 flex-1 flex-col">
              <ChatHeader conversation={activeConversation} />
              <MessageThread
                messages={activeConversation.messages}
                customerName={activeConversation.customerName}
              />
              <QuickTagBar />
              <MessageComposer onSend={handleSend} />
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-center text-sm text-slate-400">
              Chưa có hội thoại nào
            </div>
          )}

          <CustomerInfoPanel />
        </div>
      </div>
    </div>
  );
}
