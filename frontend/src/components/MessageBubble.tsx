"use client";

import { motion } from "framer-motion";
import { MarkdownMessage } from "@/components/MarkdownMessage";
import type { ChatMessage } from "@/lib/types";

type MessageBubbleProps = {
  message: ChatMessage;
};

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 420, damping: 32 }}
      className={`mb-4 flex w-full ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={
          isUser
            ? "max-w-[min(100%,36rem)] rounded-card bg-accent px-4 py-3 text-ink shadow-soft"
            : "max-w-[min(100%,36rem)] rounded-card border border-border bg-surface px-4 py-3 text-ink shadow-soft"
        }
      >
        {isUser ? (
          <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{message.content}</p>
        ) : (
          <MarkdownMessage content={message.content} />
        )}
      </div>
    </motion.div>
  );
}
