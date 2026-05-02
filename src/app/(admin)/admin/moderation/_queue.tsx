"use client";

/**
 * <ModerationQueue> — interactive child of /admin/moderation.
 *
 * Renders each event as a card with:
 *   - severity chip + status badge
 *   - flagged content (verbatim — reviewers MUST see what the child saw)
 *   - automated reason + action taken
 *   - link back to the story for context
 *   - inline review form (notes + "Mark reviewed" button) for outstanding rows
 *   - audit footer (who reviewed, when) for resolved rows
 */

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export type ReviewableEvent = {
  id: string;
  storyId: string;
  flaggedContent: string;
  reason: string;
  severity: "low" | "medium" | "high";
  actionTaken: string;
  reviewedByHuman: boolean;
  reviewedBy: string | null;
  reviewedAt: Date | null;
  reviewerNotes: string | null;
  createdAt: Date;
  storyTitle: string;
  reviewerName: string | null;
  reviewerEmail: string | null;
};

export function ModerationQueue({
  events,
  reviewerName,
}: {
  events: ReviewableEvent[];
  reviewerName: string;
}) {
  const [rows, setRows] = useState<ReviewableEvent[]>(events);

  if (rows.length === 0) {
    return (
      <article className="card-stamp p-10 text-center">
        <p className="eyebrow text-foreground/55">Nothing to review</p>
        <p className="mt-4 font-[var(--font-newsreader)] text-[15.5px] italic leading-relaxed text-foreground/70">
          The queue is empty. The forge is quiet.
        </p>
      </article>
    );
  }

  function applyReview(updated: ReviewableEvent) {
    setRows((prev) =>
      prev.map((row) => (row.id === updated.id ? updated : row)),
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {rows.map((event) => (
        <EventCard
          key={event.id}
          event={event}
          reviewerName={reviewerName}
          onReviewed={applyReview}
        />
      ))}
    </div>
  );
}

function EventCard({
  event,
  reviewerName,
  onReviewed,
}: {
  event: ReviewableEvent;
  reviewerName: string;
  onReviewed: (updated: ReviewableEvent) => void;
}) {
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleReview() {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/moderation/${event.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: notes.trim() || undefined }),
      });
      if (!res.ok) {
        throw new Error(`Review failed: ${res.status}`);
      }
      const data = (await res.json()) as {
        event: { reviewedAt: string; reviewedBy: string };
      };
      onReviewed({
        ...event,
        reviewedByHuman: true,
        reviewedBy: data.event.reviewedBy,
        reviewedAt: new Date(data.event.reviewedAt),
        reviewerNotes: notes.trim() || null,
        reviewerName: reviewerName,
      });
      toast.success("Marked reviewed");
    } catch {
      toast.error("Could not record review. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const severityTone =
    event.severity === "high"
      ? "bg-[color:var(--ember)]/15 text-[color:var(--ember)] border-[color:var(--ember)]/40"
      : event.severity === "medium"
        ? "bg-[color:var(--gold)]/25 text-foreground/80 border-border"
        : "bg-foreground/5 text-foreground/60 border-border/60";

  return (
    <article className="card-stamp overflow-hidden p-0">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 px-6 py-4 md:px-8">
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 font-mono text-[10.5px] uppercase tracking-widest ${severityTone}`}
          >
            <span
              aria-hidden="true"
              className="inline-block h-1.5 w-1.5 rounded-full bg-current"
            />
            {event.severity}
          </span>
          {event.reviewedByHuman ? (
            <span className="eyebrow text-[color:var(--forest)]">
              reviewed &check;
            </span>
          ) : (
            <span className="eyebrow text-foreground/60">
              awaiting review
            </span>
          )}
        </div>
        <span className="font-mono text-[10.5px] uppercase tracking-widest text-foreground/50">
          {new Date(event.createdAt).toISOString().slice(0, 16).replace("T", " ")} UTC
        </span>
      </header>

      <div className="px-6 py-6 md:px-8">
        <p className="eyebrow text-foreground/55">{event.reason}</p>

        <blockquote className="mt-4 whitespace-pre-wrap rounded-sm border-l-2 border-[color:var(--ember)]/60 bg-foreground/[0.03] px-4 py-3 font-[var(--font-newsreader)] text-[15px] italic leading-relaxed text-foreground/85">
          {event.flaggedContent}
        </blockquote>

        <dl className="mt-5 grid gap-3 text-[13px] text-foreground/70 md:grid-cols-2">
          <div>
            <dt className="eyebrow">Action taken</dt>
            <dd className="mt-1 font-mono text-[12.5px]">
              {event.actionTaken}
            </dd>
          </div>
          <div>
            <dt className="eyebrow">Story</dt>
            <dd className="mt-1">
              <a
                href={`/story/${event.storyId}`}
                className="text-[color:var(--ember)] underline underline-offset-4 hover:no-underline"
                target="_blank"
                rel="noreferrer"
              >
                {event.storyTitle}
              </a>
            </dd>
          </div>
        </dl>

        {event.reviewedByHuman ? (
          <ReviewedFooter event={event} />
        ) : (
          <div className="mt-6 border-t border-border/60 pt-5">
            <label
              htmlFor={`notes-${event.id}`}
              className="eyebrow text-foreground/60"
            >
              Reviewer notes (optional)
            </label>
            <Textarea
              id={`notes-${event.id}`}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What did you decide, and why?"
              rows={2}
              maxLength={500}
              disabled={submitting}
              className="mt-2 font-[var(--font-newsreader)] text-[14.5px] leading-relaxed"
            />
            <div className="mt-3 flex items-center justify-end">
              <Button
                type="button"
                onClick={() => void handleReview()}
                disabled={submitting}
                className="btn-ember justify-center disabled:opacity-50"
              >
                {submitting ? "Recording…" : "Mark reviewed"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

function ReviewedFooter({ event }: { event: ReviewableEvent }) {
  const reviewerLabel =
    event.reviewerName ?? event.reviewerEmail ?? event.reviewedBy ?? "—";
  const when = event.reviewedAt
    ? new Date(event.reviewedAt).toISOString().slice(0, 16).replace("T", " ")
    : null;

  return (
    <div className="mt-6 rounded-sm border border-border/60 bg-foreground/[0.02] px-4 py-3 text-[13px] text-foreground/65">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <span className="eyebrow text-foreground/55">Reviewed by</span>
        <span className="font-mono text-[11.5px] tracking-wide text-foreground/55">
          {when ? `${when} UTC` : ""}
        </span>
      </div>
      <p className="mt-1 font-[var(--font-newsreader)] text-[14px]">
        {reviewerLabel}
      </p>
      {event.reviewerNotes && (
        <p className="mt-2 whitespace-pre-wrap font-[var(--font-newsreader)] text-[14px] italic leading-relaxed text-foreground/75">
          “{event.reviewerNotes}”
        </p>
      )}
    </div>
  );
}
