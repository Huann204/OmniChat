"use client";

import * as React from "react";
import { Phone, PhoneMissed, Smile, Reply, MoreHorizontal, User } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ConversationMessage } from "@/types/conversation";

interface MessageThreadProps {
  messages: ConversationMessage[];
  customerName: string;
}

export function MessageThread({ messages, customerName }: MessageThreadProps) {
  const endRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  return (
    <div className="flex-1 space-y-1 overflow-y-auto bg-[#f3f0eb] pr-6 pl-2  py-4">
      {messages.map((message, index) => {
        const next = messages[index + 1];
        const isLastInGroup = !next || next.sender !== message.sender;
        return (
          <MessageRow
            key={message.id}
            message={message}
            customerName={customerName}
            showAvatar={isLastInGroup}
          />
        );
      })}
      <div ref={endRef} />
    </div>
  );
}

function MessageMeta({ name, time }: { name: string; time: string }) {
  return (
    <div className="flex shrink-0 items-center opacity-0 transition-opacity group-hover:opacity-100">
      <button
        type="button"
        className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-black/5 hover:text-slate-600 cursor-pointer"
        aria-label="Thả cảm xúc"
      >
        <Smile className="h-4 w-4" />
      </button>
      <button
        type="button"
        className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-black/5 hover:text-slate-600 cursor-pointer"
        aria-label="Trả lời"
      >
        <Reply className="h-4 w-4" />
      </button>
      <button
        type="button"
        className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-black/5 hover:text-slate-600 cursor-pointer"
        aria-label="Tùy chọn khác"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      <div className="ml-1 leading-tight">
        <p className="whitespace-nowrap text-xs font-medium text-slate-500">{name}</p>
        <p className="whitespace-nowrap text-xs text-slate-400">{time}</p>
      </div>
    </div>
  );
}

function Avatar({ show }: { show: boolean }) {
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center self-end">
      {show && (
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-slate-400">
          <User className="h-5 w-5" />
        </span>
      )}
    </div>
  );
}

interface MessageRowProps {
  message: ConversationMessage;
  customerName: string;
  showAvatar: boolean;
}

function MessageRow({ message, customerName, showAvatar }: MessageRowProps) {
  if (message.sender === "system") {
    return (
      <div className="flex justify-center py-2">
        <span className="rounded-full bg-black/5 px-3 py-1 text-xs text-slate-500">{message.text}</span>
      </div>
    );
  }

  const isPage = message.sender === "page";
  const senderName = isPage ? "Bạn" : customerName;

  if (message.kind === "call_request") {
    return (
      <div className="group flex items-end justify-end gap-2 py-1">
        <MessageMeta name={senderName} time={message.time} />
        <div className="max-w-sm rounded-2xl bg-[#d9fdd3] px-4 py-3 text-sm">
          <p className="font-semibold text-slate-800">{message.text}</p>
          {message.meta && <p className="mt-1 text-xs text-slate-500">{message.meta}</p>}
        </div>
      </div>
    );
  }

  if (message.kind === "call_outgoing" || message.kind === "call_missed") {
    const isMissed = message.kind === "call_missed";
    return (
      <div className="group flex items-end justify-end gap-2 py-1">
        <MessageMeta name={senderName} time={message.time} />
        <div className="flex max-w-sm items-center gap-3 rounded-2xl bg-[#d9fdd3] px-4 py-2.5 text-sm">
          <span
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
              isMissed ? "bg-rose-100 text-rose-500" : "bg-emerald-100 text-emerald-600"
            )}
          >
            {isMissed ? <PhoneMissed className="h-4 w-4" /> : <Phone className="h-4 w-4" />}
          </span>
          <div>
            <p className="font-semibold text-slate-800">{message.text}</p>
            {message.meta && (
              <p className={cn("text-xs", isMissed ? "text-rose-500" : "text-slate-500")}>{message.meta}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "group flex items-end gap-1.5 py-1",
        isPage ? "justify-end" : "justify-start"
      )}
    >
      {!isPage && <Avatar show={showAvatar} />}
      {isPage && <MessageMeta name={senderName} time={message.time} />}

      <div
        className={cn(
          "max-w-sm rounded-2xl px-4 py-2 text-sm shadow-sm",
          isPage ? "bg-[#d9fdd3] text-slate-800" : "bg-white text-slate-800"
        )}
      >
        {message.text}
      </div>

      {!isPage && <MessageMeta name={senderName} time={message.time} />}
    </div>
  );
}
