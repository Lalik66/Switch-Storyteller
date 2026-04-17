"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useChat } from "@ai-sdk/react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { UserProfile } from "@/components/auth/user-profile";
import { useSession } from "@/lib/auth-client";
import type { Components } from "react-markdown";

/* ── Markdown styling — Newsreader body, Fraunces headings ──────────── */

const H1: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = (props) => (
  <h1
    className="mt-3 mb-3 font-[var(--font-fraunces)] text-[22px] leading-tight"
    {...props}
  />
);
const H2: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = (props) => (
  <h2
    className="mt-3 mb-2 font-[var(--font-fraunces)] text-[19px] leading-tight"
    {...props}
  />
);
const H3: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = (props) => (
  <h3
    className="mt-3 mb-2 font-[var(--font-fraunces)] text-[17px] leading-tight"
    {...props}
  />
);
const Paragraph: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = (
  props
) => (
  <p
    className="mb-3 font-[var(--font-newsreader)] text-[15px] leading-relaxed"
    {...props}
  />
);
const UL: React.FC<React.HTMLAttributes<HTMLUListElement>> = (props) => (
  <ul
    className="mb-3 ml-5 list-disc space-y-1 font-[var(--font-newsreader)] text-[15px] leading-relaxed marker:text-[color:var(--ember)]"
    {...props}
  />
);
const OL: React.FC<React.OlHTMLAttributes<HTMLOListElement>> = (props) => (
  <ol
    className="mb-3 ml-5 list-decimal space-y-1 font-[var(--font-newsreader)] text-[15px] leading-relaxed marker:text-[color:var(--ember)]"
    {...props}
  />
);
const LI: React.FC<React.LiHTMLAttributes<HTMLLIElement>> = (props) => (
  <li className="leading-relaxed" {...props} />
);
const Anchor: React.FC<React.AnchorHTMLAttributes<HTMLAnchorElement>> = (
  props
) => (
  <a
    className="text-[color:var(--ember)] underline-offset-4 hover:underline"
    target="_blank"
    rel="noreferrer noopener"
    {...props}
  />
);
const Blockquote: React.FC<React.BlockquoteHTMLAttributes<HTMLElement>> = (
  props
) => (
  <blockquote
    className="mb-3 border-l-2 border-[color:var(--ember)]/60 pl-4 font-[var(--font-newsreader)] italic text-foreground/75"
    {...props}
  />
);
const Code: Components["code"] = ({ children, className, ...props }) => {
  const match = /language-(\w+)/.exec(className || "");
  const isInline = !match;

  if (isInline) {
    return (
      <code
        className="rounded-sm border border-[color:var(--border)] bg-[color:var(--gold)]/15 px-1.5 py-0.5 font-mono text-[12px] text-foreground/85"
        {...props}
      >
        {children}
      </code>
    );
  }
  return (
    <pre className="mb-3 w-full overflow-x-auto rounded-sm border border-[color:var(--border)] bg-[color:var(--card)] p-3.5">
      <code className="font-mono text-[12.5px] leading-5" {...props}>
        {children}
      </code>
    </pre>
  );
};
const HR: React.FC<React.HTMLAttributes<HTMLHRElement>> = (props) => (
  <hr className="my-5 border-[color:var(--border)]" {...props} />
);
const Table: React.FC<React.TableHTMLAttributes<HTMLTableElement>> = (
  props
) => (
  <div className="mb-3 overflow-x-auto">
    <table
      className="w-full border-collapse font-[var(--font-newsreader)] text-[14px]"
      {...props}
    />
  </div>
);
const TH: React.FC<React.ThHTMLAttributes<HTMLTableCellElement>> = (props) => (
  <th
    className="border border-[color:var(--border)] bg-[color:var(--gold)]/15 px-2.5 py-1.5 text-left font-[var(--font-fraunces)]"
    {...props}
  />
);
const TD: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = (props) => (
  <td
    className="border border-[color:var(--border)] px-2.5 py-1.5"
    {...props}
  />
);

const markdownComponents: Components = {
  h1: H1,
  h2: H2,
  h3: H3,
  p: Paragraph,
  ul: UL,
  ol: OL,
  li: LI,
  a: Anchor,
  blockquote: Blockquote,
  code: Code,
  hr: HR,
  table: Table,
  th: TH,
  td: TD,
};

/* ── Message helpers ────────────────────────────────────────────────── */

type TextPart = { type?: string; text?: string };
type MaybePartsMessage = {
  display?: ReactNode;
  parts?: TextPart[];
  content?: TextPart[];
};

function getMessageText(message: MaybePartsMessage): string {
  const parts = Array.isArray(message.parts)
    ? message.parts
    : Array.isArray(message.content)
      ? message.content
      : [];
  return parts
    .filter((p) => p?.type === "text" && p.text)
    .map((p) => p.text)
    .join("\n");
}

function renderMessageContent(message: MaybePartsMessage): ReactNode {
  if (message.display) return message.display;
  const parts = Array.isArray(message.parts)
    ? message.parts
    : Array.isArray(message.content)
      ? message.content
      : [];
  return parts.map((p, idx) =>
    p?.type === "text" && p.text ? (
      <ReactMarkdown key={idx} components={markdownComponents}>
        {p.text}
      </ReactMarkdown>
    ) : null
  );
}

function formatTimestamp(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

/* ── Inline icons (replacing Lucide) ────────────────────────────────── */

function CopyIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 12h14M13 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Copied to the margin");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label="Copy passage"
      className="rounded-sm p-1 text-foreground/45 transition-colors hover:bg-[color:var(--gold)]/20 hover:text-[color:var(--ember)]"
      title="Copy passage"
    >
      {copied ? (
        <span className="text-[color:var(--forest)]">
          <CheckIcon />
        </span>
      ) : (
        <CopyIcon />
      )}
    </button>
  );
}

function ThinkingIndicator() {
  return (
    <div className="flex items-center gap-3 rounded-sm border border-[color:var(--border)] bg-[color:var(--card)] px-4 py-3">
      <span className="flex gap-1" aria-hidden="true">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[color:var(--ember)] [animation-delay:0ms]" />
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[color:var(--ember)] [animation-delay:150ms]" />
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[color:var(--ember)] [animation-delay:300ms]" />
      </span>
      <span className="eyebrow text-foreground/60">
        The storyteller considers&hellip;
      </span>
    </div>
  );
}

const STORAGE_KEY = "chat-messages";

export default function ChatPage() {
  const { data: session, isPending } = useSession();
  const { messages, sendMessage, status, error, setMessages } = useChat({
    onError: (err) => {
      toast.error(err.message || "Failed to send message");
    },
  });
  const [input, setInput] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMessages(parsed);
          }
        } catch {
          // Invalid JSON, ignore
        }
      }
    }
  }, [setMessages]);

  useEffect(() => {
    if (typeof window !== "undefined" && messages.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    }
  }, [messages]);

  const clearMessages = () => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
    toast.success("The folio is closed");
  };

  if (isPending) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <p className="eyebrow text-foreground/55">
          Loading the quill&hellip;
        </p>
      </div>
    );
  }

  if (!session) {
    return (
      <section className="container mx-auto px-6 py-32 md:py-40">
        <div className="mx-auto max-w-xl text-center">
          <p className="eyebrow">&sect; Threshold &middot; A locked folio</p>
          <h1 className="display-xl mt-6 text-[clamp(2.8rem,6vw,4.8rem)] leading-[0.95]">
            The storyteller is&nbsp;
            <span className="italic-wonk text-[color:var(--ember)]">
              expecting you.
            </span>
          </h1>

          <div className="rule-ornament my-8 mx-auto max-w-xs">
            <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M12 2l2 7 7 2-7 2-2 7-2-7-7-2 7-2z"
                fill="currentColor"
              />
            </svg>
          </div>

          <p className="mx-auto max-w-md font-[var(--font-newsreader)] text-[15.5px] leading-relaxed text-foreground/70">
            Sign in to open the chat. Your past conversations will be waiting
            on the next page.
          </p>

          <div className="mt-10 flex justify-center">
            <UserProfile />
          </div>
        </div>
      </section>
    );
  }

  const isStreaming = status === "streaming";
  const firstName = session.user.name?.split(" ")[0] ?? "scribe";

  return (
    <section className="container mx-auto px-6 py-16 md:py-20">
      <div className="mx-auto max-w-3xl">
        <header className="mb-10 flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow">&sect; The quill &middot; Today</p>
            <h1 className="display-lg mt-3 text-4xl md:text-5xl">
              Good to see you,
              <br />
              <span className="italic-wonk text-[color:var(--ember)]">
                {firstName}.
              </span>
            </h1>
          </div>
          <Link
            href="/dashboard"
            className="eyebrow mt-2 shrink-0 text-foreground/55 transition-colors hover:text-[color:var(--ember)]"
          >
            &larr; Workshop
          </Link>
        </header>

        {error && (
          <div
            role="alert"
            className="mb-6 rounded-sm border border-[color:var(--destructive)]/40 bg-[color:var(--destructive)]/10 px-4 py-3 font-[var(--font-newsreader)] text-[14px] italic text-[color:var(--destructive)]"
          >
            {error.message || "Something went wrong"}
          </div>
        )}

        <article className="card-stamp p-6 md:p-8">
          <div className="flex items-center justify-between">
            <p className="eyebrow text-foreground/55">
              {messages.length === 0
                ? "§ A fresh page"
                : `§ ${messages.length} ${
                    messages.length === 1 ? "passage" : "passages"
                  }`}
            </p>
            {messages.length > 0 && (
              <button
                type="button"
                onClick={clearMessages}
                className="eyebrow text-foreground/55 transition-colors hover:text-[color:var(--ember)]"
              >
                Close folio
              </button>
            )}
          </div>

          <div className="rule-ornament my-5">
            <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M12 2l2 7 7 2-7 2-2 7-2-7-7-2 7-2z"
                fill="currentColor"
              />
            </svg>
          </div>

          <div className="flex min-h-[45vh] flex-col gap-5 overflow-y-auto">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                <p className="font-[var(--font-newsreader)] text-[15.5px] italic text-foreground/60">
                  A fresh page. Ask the storyteller anything &mdash; a
                  character, a scene, a twist.
                </p>
              </div>
            )}

            {messages.map((message) => {
              const messageText = getMessageText(message as MaybePartsMessage);
              const createdAt = (message as { createdAt?: Date }).createdAt;
              const timestamp = createdAt
                ? formatTimestamp(new Date(createdAt))
                : null;
              const isUser = message.role === "user";

              return (
                <div
                  key={message.id}
                  className={`group flex w-full ${
                    isUser ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-sm border px-4 py-3 ${
                      isUser
                        ? "border-[color:var(--ember)]/50 bg-[color:var(--gold)]/20"
                        : "border-[color:var(--border)] bg-[color:var(--card)]"
                    }`}
                  >
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <div className="flex items-baseline gap-2">
                        <span className="eyebrow text-foreground/60">
                          {isUser ? "You" : "Storyteller"}
                        </span>
                        {timestamp && (
                          <span className="font-mono text-[10.5px] uppercase tracking-widest text-foreground/40">
                            {timestamp}
                          </span>
                        )}
                      </div>
                      {!isUser && messageText && (
                        <div className="opacity-0 transition-opacity group-hover:opacity-100">
                          <CopyButton text={messageText} />
                        </div>
                      )}
                    </div>
                    <div className="text-foreground/90">
                      {renderMessageContent(message as MaybePartsMessage)}
                    </div>
                  </div>
                </div>
              );
            })}

            {isStreaming && messages[messages.length - 1]?.role === "user" && (
              <div className="flex w-full justify-start">
                <ThinkingIndicator />
              </div>
            )}
          </div>
        </article>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            const text = input.trim();
            if (!text) return;
            sendMessage({ role: "user", parts: [{ type: "text", text }] });
            setInput("");
          }}
          className="mt-6 flex flex-col gap-3 sm:flex-row"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask the storyteller&hellip;"
            disabled={isStreaming}
            aria-label="Your message"
            className="flex-1 rounded-sm border border-[color:var(--input)] bg-[color:var(--card)] px-3.5 py-2.5 font-[var(--font-newsreader)] text-[15px] text-foreground placeholder:italic placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-[color:var(--ember)] focus:ring-offset-2 focus:ring-offset-[color:var(--parchment)] disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isStreaming}
            className="btn-ember justify-center disabled:opacity-50"
          >
            {isStreaming ? "Quill moving\u2026" : "Send"}
            {!isStreaming && <ArrowIcon />}
          </button>
        </form>
      </div>
    </section>
  );
}
