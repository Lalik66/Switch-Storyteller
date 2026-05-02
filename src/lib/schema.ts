import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  boolean,
  index,
  uuid,
  integer,
  jsonb,
  pgEnum,
} from "drizzle-orm/pg-core";

// IMPORTANT! ID fields should ALWAYS use UUID types, EXCEPT the BetterAuth tables.

// Phase 4 (Layer 4 moderation): role distinguishes a parent / regular user
// from a human reviewer who can access the admin moderation queue.
// Default "user" so existing rows back-fill safely.
export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);

export const user = pgTable(
  "user",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: boolean("email_verified").default(false).notNull(),
    image: text("image"),
    role: userRoleEnum("role").notNull().default("user"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("user_email_idx").on(table.email)]
);

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [
    index("session_user_id_idx").on(table.userId),
    index("session_token_idx").on(table.token),
  ]
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("account_user_id_idx").on(table.userId),
    index("account_provider_account_idx").on(table.providerId, table.accountId),
  ]
);

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

// ---------------------------------------------------------------------------
// The Hero's Forge — Phase 1 domain tables
// ---------------------------------------------------------------------------
// All domain tables use UUID primary keys (per schema convention) and
// timezone-aware timestamps. Enums are declared as Postgres enums so Drizzle
// can produce proper CHECK-backed column types in the generated migration.

export const contentStrictnessEnum = pgEnum("content_strictness", [
  "standard",
  "strict",
]);

export const storyStatusEnum = pgEnum("story_status", [
  "draft",
  "complete",
  "published",
  "archived",
]);

export const moderationStatusEnum = pgEnum("moderation_status", [
  "pending",
  "safe",
  "flagged",
]);

export const moderationActionEnum = pgEnum("moderation_action", [
  "blocked",
  "sanitized",
  "allowed",
]);

export const moderationSeverityEnum = pgEnum("moderation_severity", [
  "low",
  "medium",
  "high",
]);

export const childProfile = pgTable(
  "child_profile",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    parentUserId: text("parent_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    displayName: text("display_name").notNull(),
    age: integer("age").notNull(),
    avatarUrl: text("avatar_url"),
    contentStrictness: contentStrictnessEnum("content_strictness")
      .notNull()
      .default("standard"),
    allowPublish: boolean("allow_publish").notNull().default(false),
    allowRemix: boolean("allow_remix").notNull().default(false),
    dailyMinuteLimit: integer("daily_minute_limit"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("child_profile_parent_user_id_idx").on(table.parentUserId)]
);

export const story = pgTable(
  "story",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    childProfileId: uuid("child_profile_id")
      .notNull()
      .references(() => childProfile.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    worldKey: text("world_key").notNull(),
    heroName: text("hero_name").notNull(),
    problemText: text("problem_text").notNull(),
    status: storyStatusEnum("status").notNull().default("draft"),
    wordCount: integer("word_count").notNull().default(0),
    chapterCount: integer("chapter_count").notNull().default(0),
    moderationFlags: jsonb("moderation_flags"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    // Primary feed query: list a child's stories, newest first.
    index("story_child_profile_created_at_idx").on(
      table.childProfileId,
      sql`${table.createdAt} desc`
    ),
  ]
);

export const storyPage = pgTable(
  "story_page",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    storyId: uuid("story_id")
      .notNull()
      .references(() => story.id, { onDelete: "cascade" }),
    pageNumber: integer("page_number").notNull(),
    aiContent: text("ai_content").notNull(),
    childContent: text("child_content"),
    chosenActionKey: text("chosen_action_key"),
    moderationStatus: moderationStatusEnum("moderation_status")
      .notNull()
      .default("pending"),
    modelUsed: text("model_used").notNull(),
    tokenUsage: jsonb("token_usage"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    // Ordered read of a single story's pages.
    index("story_page_story_id_page_number_idx").on(
      table.storyId,
      table.pageNumber
    ),
  ]
);

export const promptLog = pgTable("prompt_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  storyId: uuid("story_id")
    .notNull()
    .references(() => story.id, { onDelete: "cascade" }),
  originalPrompt: text("original_prompt").notNull(),
  moderatedPrompt: text("moderated_prompt").notNull(),
  moderationAction: moderationActionEnum("moderation_action").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const moderationEvent = pgTable(
  "moderation_event",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    storyId: uuid("story_id")
      .notNull()
      .references(() => story.id, { onDelete: "cascade" }),
    flaggedContent: text("flagged_content").notNull(),
    reason: text("reason").notNull(),
    severity: moderationSeverityEnum("severity").notNull(),
    actionTaken: text("action_taken").notNull(),
    reviewedByHuman: boolean("reviewed_by_human").notNull().default(false),
    // Phase 4: Layer 4 reviewer audit trail. `reviewedBy` is set-null on
    // user delete so we keep the historical event row even if the
    // reviewer is later removed.
    reviewedBy: text("reviewed_by").references(() => user.id, {
      onDelete: "set null",
    }),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    reviewerNotes: text("reviewer_notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    // Admin review queue: highest severity, most recent first.
    index("moderation_event_severity_created_at_idx").on(
      table.severity,
      sql`${table.createdAt} desc`
    ),
    // Filter the queue to "still needs review" — the most common admin query.
    index("moderation_event_unreviewed_idx").on(
      table.reviewedByHuman,
      sql`${table.createdAt} desc`
    ),
  ]
);

// ---------------------------------------------------------------------------
// The Hero's Forge — Phase 2 domain tables
// ---------------------------------------------------------------------------

export const character = pgTable(
  "character",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    childProfileId: uuid("child_profile_id")
      .notNull()
      .references(() => childProfile.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description").notNull(),
    // description_embedding (pgvector 1536-dim) is deferred until the
    // pgvector extension is confirmed enabled on the target Postgres instance.
    // Add via a separate migration: ALTER TABLE character ADD COLUMN
    // description_embedding vector(1536).
    imageUrl: text("image_url"),
    appearanceCount: integer("appearance_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("character_child_profile_id_idx").on(table.childProfileId),
  ]
);

export const storyImage = pgTable(
  "story_image",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    storyPageId: uuid("story_page_id")
      .notNull()
      .references(() => storyPage.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    // SHA-256 of the normalised scene prompt — cache key for reuse across stories.
    sceneHash: text("scene_hash").notNull().unique(),
    modelUsed: text("model_used").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("story_image_scene_hash_idx").on(table.sceneHash),
  ]
);

export const storyAudio = pgTable(
  "story_audio",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    storyPageId: uuid("story_page_id")
      .notNull()
      .references(() => storyPage.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    // SHA-256 of (voiceId | modelUsed | normalised text) — cache key for reuse.
    audioHash: text("audio_hash").notNull().unique(),
    voiceId: text("voice_id").notNull(),
    modelUsed: text("model_used").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("story_audio_audio_hash_idx").on(table.audioHash)]
);

export const parentReport = pgTable(
  "parent_report",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    parentUserId: text("parent_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    childProfileId: uuid("child_profile_id")
      .notNull()
      .references(() => childProfile.id, { onDelete: "cascade" }),
    weekEnding: timestamp("week_ending", { withTimezone: true }).notNull(),
    storiesCreated: integer("stories_created").notNull().default(0),
    totalWordsWritten: integer("total_words_written").notNull().default(0),
    vocabularyHighlights: jsonb("vocabulary_highlights"),
    moderationIncidents: integer("moderation_incidents").notNull().default(0),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("parent_report_parent_child_week_idx").on(
      table.parentUserId,
      table.childProfileId,
      table.weekEnding
    ),
  ]
);

// ---------------------------------------------------------------------------
// Drizzle inferred types (consumed by downstream agents / route handlers)
// ---------------------------------------------------------------------------

export type ChildProfile = typeof childProfile.$inferSelect;
export type NewChildProfile = typeof childProfile.$inferInsert;

export type Story = typeof story.$inferSelect;
export type NewStory = typeof story.$inferInsert;

export type StoryPage = typeof storyPage.$inferSelect;
export type NewStoryPage = typeof storyPage.$inferInsert;

export type PromptLog = typeof promptLog.$inferSelect;
export type NewPromptLog = typeof promptLog.$inferInsert;

export type ModerationEvent = typeof moderationEvent.$inferSelect;
export type NewModerationEvent = typeof moderationEvent.$inferInsert;

export type Character = typeof character.$inferSelect;
export type NewCharacter = typeof character.$inferInsert;

export type StoryImage = typeof storyImage.$inferSelect;
export type NewStoryImage = typeof storyImage.$inferInsert;

export type StoryAudio = typeof storyAudio.$inferSelect;
export type NewStoryAudio = typeof storyAudio.$inferInsert;

export type ParentReport = typeof parentReport.$inferSelect;
export type NewParentReport = typeof parentReport.$inferInsert;
