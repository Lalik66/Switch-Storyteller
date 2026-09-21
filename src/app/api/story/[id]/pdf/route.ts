import React from "react";
import { headers } from "next/headers";
import { Document, Page, Text, View, StyleSheet, renderToStream } from "@react-pdf/renderer";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { story, storyPage, childProfile } from "@/lib/schema";
import { upload } from "@/lib/storage";

// Basic brand-neutral styling — the design system lives in the UI layer; the PDF
// is an export artifact and deliberately stays typographically conservative.
const styles = StyleSheet.create({
  page: { padding: 48, fontSize: 12, fontFamily: "Helvetica", lineHeight: 1.5 },
  title: { fontSize: 24, marginBottom: 24, fontFamily: "Helvetica-Bold" },
  pageHeader: { fontSize: 10, color: "#666", marginBottom: 8 },
  pageBody: { fontSize: 12 },
  pageBreak: { marginBottom: 24 },
});

interface StoryPageRow {
  pageNumber: number;
  aiContent: string;
  childContent: string | null;
}

function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "story"
  );
}

function buildDocument(title: string, pages: StoryPageRow[]) {
  return React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: "A4", style: styles.page },
      React.createElement(Text, { style: styles.title }, title),
      ...pages.map((p) =>
        React.createElement(
          View,
          { key: p.pageNumber, style: styles.pageBreak, wrap: false },
          React.createElement(
            Text,
            { style: styles.pageHeader },
            `Page ${p.pageNumber}`
          ),
          React.createElement(Text, { style: styles.pageBody }, p.aiContent),
          p.childContent
            ? React.createElement(
                Text,
                { style: { ...styles.pageBody, marginTop: 6, fontStyle: "italic" } },
                p.childContent
              )
            : null
        )
      )
    )
  );
}

// Drain a Node readable stream into a Buffer. `@react-pdf/renderer`'s
// `renderToStream` returns a Node Readable; Web Streams are wrapped via Response.
async function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(
      Buffer.isBuffer(chunk)
        ? chunk
        : typeof chunk === "string"
          ? Buffer.from(chunk)
          : Buffer.from(chunk as Uint8Array)
    );
  }
  return Buffer.concat(chunks);
}

const jsonError = (error: string, status: number) =>
  new Response(JSON.stringify({ error }), {
    status,
    headers: { "Content-Type": "application/json" },
  });

/**
 * Session-gate, verify ownership (parent owns child owns story), and render
 * the story to a PDF buffer. Shared by GET (download) and POST (persist).
 */
async function renderOwnedStoryPdf(
  storyId: string,
  userId: string,
): Promise<
  | { ok: true; pdfBuffer: Buffer; filename: string }
  | { ok: false; response: Response }
> {
  if (!z.string().uuid().safeParse(storyId).success) {
    return { ok: false, response: jsonError("Invalid story id", 400) };
  }

  const [storyRow] = await db
    .select()
    .from(story)
    .where(eq(story.id, storyId))
    .limit(1);
  if (!storyRow) {
    return { ok: false, response: jsonError("Story not found", 404) };
  }

  const [child] = await db
    .select()
    .from(childProfile)
    .where(eq(childProfile.id, storyRow.childProfileId))
    .limit(1);
  if (!child || child.parentUserId !== userId) {
    return { ok: false, response: jsonError("Forbidden", 403) };
  }

  const pages = await db
    .select()
    .from(storyPage)
    .where(eq(storyPage.storyId, storyId))
    .orderBy(asc(storyPage.pageNumber));

  const doc = buildDocument(
    storyRow.title,
    pages.map((p) => ({
      pageNumber: p.pageNumber,
      aiContent: p.aiContent,
      childContent: p.childContent,
    }))
  );

  const pdfStream = (await renderToStream(doc)) as NodeJS.ReadableStream;
  const pdfBuffer = await streamToBuffer(pdfStream);
  return { ok: true, pdfBuffer, filename: `${slugify(storyRow.title)}.pdf` };
}

// GET — stream the PDF as a download. Read-only, no side effects.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return jsonError("Unauthorized", 401);

  const { id: storyId } = await params;
  const result = await renderOwnedStoryPdf(storyId, session.user.id);
  if (!result.ok) return result.response;

  return new Response(new Uint8Array(result.pdfBuffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${result.filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}

// POST — render and persist to blob storage, returning a stable URL. The
// persistence side-effect lives on POST (not a GET ?persist=1) so it can't be
// triggered by a prefetch, <img>, or cross-site link.
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return jsonError("Unauthorized", 401);

  const { id: storyId } = await params;
  const result = await renderOwnedStoryPdf(storyId, session.user.id);
  if (!result.ok) return result.response;

  const stored = await upload(
    result.pdfBuffer,
    result.filename,
    `stories/${storyId}`,
  );

  return new Response(JSON.stringify({ url: stored.url }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
