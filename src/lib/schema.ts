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


export const user = pgTable(
  "user",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: boolean("email_verified").default(false).notNull(),
    image: text("image"),
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
