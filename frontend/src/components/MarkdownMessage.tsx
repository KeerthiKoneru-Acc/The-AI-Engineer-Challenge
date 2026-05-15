"use client";

import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkGfm from "remark-gfm";

type MarkdownMessageProps = {
  content: string;
};

/**
 * Renders tutor markdown with GFM tables/task lists and fenced code
 * blocks highlighted via Prism (JetBrains Mono applied in Tailwind `font-mono`).
 */
export function MarkdownMessage({ content }: MarkdownMessageProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p({ children }) {
          return <p className="mb-3 last:mb-0 text-ink">{children}</p>;
        },
        ul({ children }) {
          return <ul className="mb-3 list-disc pl-5 text-ink">{children}</ul>;
        },
        ol({ children }) {
          return <ol className="mb-3 list-decimal pl-5 text-ink">{children}</ol>;
        },
        li({ children }) {
          return <li className="mb-1">{children}</li>;
        },
        h1({ children }) {
          return (
            <h1 className="mb-2 text-lg font-semibold tracking-wide text-ink">
              {children}
            </h1>
          );
        },
        h2({ children }) {
          return (
            <h2 className="mb-2 text-base font-semibold tracking-wide text-ink">
              {children}
            </h2>
          );
        },
        h3({ children }) {
          return (
            <h3 className="mb-2 text-sm font-semibold tracking-wide text-ink">
              {children}
            </h3>
          );
        },
        a({ href, children }) {
          return (
            <a
              href={href}
              className="text-hint underline decoration-hint/50 underline-offset-2 hover:decoration-hint"
              rel="noopener noreferrer"
              target="_blank"
            >
              {children}
            </a>
          );
        },
        blockquote({ children }) {
          return (
            <blockquote className="border-l-2 border-accent/60 pl-3 text-muted">
              {children}
            </blockquote>
          );
        },
        code({ className, children }) {
          const match = /language-(\w+)/.exec(className ?? "");
          const language = match?.[1] ?? "";
          const codeString = String(children).replace(/\n$/, "");
          const isInline = !className;

          if (isInline) {
            return (
              <code
                className="rounded-control bg-surface px-1.5 py-0.5 font-mono text-sm text-hint"
              >
                {children}
              </code>
            );
          }

          return (
            <SyntaxHighlighter
              style={oneDark}
              language={language || "text"}
              PreTag="div"
              customStyle={{
                margin: "0.75rem 0",
                padding: "1rem",
                borderRadius: "8px",
                background: "#1C1E26",
                border: "1px solid #2E3044",
                fontSize: "0.875rem",
                lineHeight: 1.55,
              }}
              codeTagProps={{
                style: {
                  fontFamily: "var(--font-jetbrains-mono), ui-monospace, monospace",
                },
              }}
            >
              {codeString}
            </SyntaxHighlighter>
          );
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
