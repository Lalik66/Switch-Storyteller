"use client";

/**
 * Renders a story page's prose block — headings in Fraunces, body in
 * Newsreader — matching the Story page preview in docs/design-system/patterns.md.
 */

import Markdown from "react-markdown";
import type { Components } from "react-markdown";

const storyMarkdownComponents: Components = {
  h1: ({ children }) => (
    <h1 className="font-[var(--font-fraunces)] text-2xl font-medium tracking-tight text-foreground md:text-3xl [&:not(:first-child)]:mt-6">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="font-[var(--font-fraunces)] text-xl font-medium tracking-tight text-foreground md:text-2xl [&:not(:first-child)]:mt-5">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="font-[var(--font-fraunces)] text-lg font-medium tracking-tight text-foreground md:text-xl [&:not(:first-child)]:mt-5">
      {children}
    </h3>
  ),
  h4: ({ children }) => (
    <h4 className="font-[var(--font-fraunces)] text-base font-medium tracking-tight text-[color:var(--ember)] [&:not(:first-child)]:mt-4">
      {children}
    </h4>
  ),
  p: ({ children }) => (
    <p className="font-[var(--font-newsreader)] text-[17px] leading-[1.85] text-foreground/90 [&+p]:mt-4">
      {children}
    </p>
  ),
  hr: () => <hr className="my-5 border-border/60" aria-hidden="true" />,
  em: ({ children }) => (
    <em className="italic text-[color:var(--ember)]">{children}</em>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-foreground">{children}</strong>
  ),
};

export function StoryPageProse({ content }: { content: string }) {
  if (!content.trim()) {
    return <span className="italic text-foreground/40">&hellip;</span>;
  }

  return (
    <div className="story-page-prose">
      <Markdown components={storyMarkdownComponents}>{content}</Markdown>
    </div>
  );
}
