"use client";

/**
 * <PublishToggle> — small per-story client island on the parent's library.
 *
 * Toggles between `published` and `complete`. On error, surfaces the
 * server's reason via a toast (e.g. "needs more pages", "child profile
 * doesn't allow publishing yet"). On success, calls `router.refresh()`
 * so the surrounding Server Component re-renders with the new status.
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type ServerError = {
  error?: string;
  message?: string;
  currentPageCount?: number;
  requiredPageCount?: number;
};

export function PublishToggle({
  storyId,
  currentStatus,
}: {
  storyId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [submitting, setSubmitting] = useState(false);

  const isPublished = currentStatus === "published";

  async function handleToggle() {
    if (submitting || pending) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/story/${storyId}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publish: !isPublished }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as ServerError;
        toast.error(
          data.message ??
            (res.status === 403
              ? "Publishing isn't allowed for this child profile yet."
              : "Couldn't update publish state. Try again."),
        );
        return;
      }

      toast.success(isPublished ? "Story unpublished." : "Story published!");
      startTransition(() => {
        router.refresh();
      });
    } catch {
      toast.error("Couldn't reach the server. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const busy = submitting || pending;

  return (
    <button
      type="button"
      onClick={() => void handleToggle()}
      disabled={busy}
      className={
        isPublished
          ? "eyebrow rounded-sm border border-border/70 px-3 py-1 text-foreground/70 transition-colors hover:border-[color:var(--ember)] hover:text-[color:var(--ember)] disabled:opacity-50"
          : "eyebrow rounded-sm bg-[color:var(--ember)] px-3 py-1 text-[color:var(--primary-foreground)] transition-opacity hover:opacity-90 disabled:opacity-50"
      }
    >
      {busy ? "…" : isPublished ? "Unpublish" : "Publish"}
    </button>
  );
}
