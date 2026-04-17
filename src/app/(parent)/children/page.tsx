/**
 * Parent dashboard — child profile management.
 *
 * PRD references: §4.1 (parent onboarding), §5 (child profiles),
 * §11 (bilingual copy). See
 * `.claude/plans/sequential-bubbling-horizon.md`.
 *
 * Server Component shell. Session-gated via `requireAuth()`; the DB
 * query that lists the parent's child profiles is stubbed behind a
 * TODO for the schema-agent. The interactive list + add/edit dialog
 * ship as a client child (`_children-manager.tsx`).
 */


import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { childProfile } from "@/lib/schema";
import { requireAuth } from "@/lib/session";
import { ChildrenManager } from "./_children-manager";
import type { InferSelectModel } from "drizzle-orm";

type ChildProfile = InferSelectModel<typeof childProfile>;

/**
 * Lists every `child_profile` row owned by the current parent,
 * newest first.
 */
async function loadChildrenForParent(
  parentId: string
): Promise<ChildProfile[]> {
  return db
    .select()
    .from(childProfile)
    .where(eq(childProfile.parentUserId, parentId))
    .orderBy(desc(childProfile.createdAt));
}

export default async function ParentChildrenPage() {
  const session = await requireAuth();
  const children = await loadChildrenForParent(session.user.id);

  const parentFirstName = session.user.name?.split(" ")[0] ?? "friend";

  return (
    <section className="container mx-auto px-6 py-16 md:py-24">
      <div className="mx-auto max-w-4xl">
        <header className="mb-12 max-w-2xl">
          <p className="eyebrow">&sect; The parent&rsquo;s room &middot; Today</p>
          <h1 className="display-lg mt-4 text-4xl md:text-5xl">
            Your little{" "}
            <span className="italic-wonk text-[color:var(--ember)]">
              scribes,
            </span>
            <br />
            {parentFirstName}.
          </h1>
          <p className="mt-5 font-[var(--font-newsreader)] text-[15.5px] leading-relaxed text-foreground/70">
            Each child has their own quiet reading profile. Age, strictness,
            and daily limits are kept here and honoured by the storyteller on
            every page.
          </p>
        </header>

        <ChildrenManager initialChildren={children} />
      </div>
    </section>
  );
}
