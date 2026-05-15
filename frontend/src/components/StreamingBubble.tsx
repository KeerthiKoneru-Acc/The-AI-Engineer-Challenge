"use client";

import { motion } from "framer-motion";
import { MarkdownMessage } from "@/components/MarkdownMessage";

type Props = {
  text: string;
  streaming: boolean;
};

/**
 * In-progress assistant reply: markdown updates as chunks arrive; animated dots while streaming.
 */
export function StreamingBubble({ text, streaming }: Props) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 420, damping: 32 }}
      className="mb-4 flex w-full justify-start"
    >
      <div className="max-w-[min(100%,36rem)] rounded-card border border-border bg-surface px-4 py-3 text-ink shadow-soft">
        {text ? <MarkdownMessage content={text} /> : null}
        {streaming ? (
          <span className="streaming-dots" aria-live="polite" aria-label="Tutor is typing">
            <span>.</span>
            <span>.</span>
            <span>.</span>
          </span>
        ) : null}
      </div>
    </motion.div>
  );
}
