import React from "react";
import { headers } from "next/headers";
import { Document, Page, Text, View, StyleSheet, renderToStream } from "@react-pdf/renderer";
import { asc, eq } from "drizzle-orm";
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

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Session gate mirrors src/app/api/chat/route.ts.
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { id: storyId } = await params;

  // Load the story and verify the child_profile belongs to the requesting parent.
  const storyRows = await db
    .select()
    .from(story)
    .where(eq(story.id, storyId))
    .limit(1);
  const storyRow = storyRows[0];
  if (!storyRow) {
    return new Response(JSON.stringify({ error: "Story not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const childRows = await db
    .select()
    .from(childProfile)
    .where(eq(childProfile.id, storyRow.childProfileId))
    .limit(1);
  const child = childRows[0];
  if (!child || child.parentUserId !== session.user.id) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
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

  const filename = `${slugify(storyRow.title)}.pdf`;

  // Optional persistence: ?persist=1 pipes the PDF through storage.ts so the
  // parent dashboard (and, later, the Lulu print flow) can reference a stable URL.
  const url = new URL(req.url);
  if (url.searchParams.get("persist") === "1") {
    await upload(pdfBuffer, filename, `stories/${storyId}`);
  }

  return new Response(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
