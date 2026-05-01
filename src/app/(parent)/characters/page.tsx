import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { childProfile, character } from "@/lib/schema";
import { requireAuth } from "@/lib/session";
import { CharacterVault } from "./_character-vault";
import type { InferSelectModel } from "drizzle-orm";

type ChildProfile = InferSelectModel<typeof childProfile>;
type Character = InferSelectModel<typeof character>;

export type ChildWithCharacters = {
  child: ChildProfile;
  characters: Character[];
};

async function loadChildrenWithCharacters(
  parentId: string,
): Promise<ChildWithCharacters[]> {
  const children = await db
    .select()
    .from(childProfile)
    .where(eq(childProfile.parentUserId, parentId))
    .orderBy(desc(childProfile.createdAt));

  const result: ChildWithCharacters[] = [];

  for (const child of children) {
    const chars = await db
      .select()
      .from(character)
      .where(eq(character.childProfileId, child.id))
      .orderBy(desc(character.appearanceCount));

    result.push({ child, characters: chars });
  }

  return result;
}

export default async function CharacterVaultPage() {
  const session = await requireAuth();
  const data = await loadChildrenWithCharacters(session.user.id);

  return (
    <section className="container mx-auto px-6 py-16 md:py-24">
      <div className="mx-auto max-w-4xl">
        <header className="mb-12 max-w-2xl">
          <p className="eyebrow">
            &sect; The character vault &middot; Phase II
          </p>
          <h1 className="display-lg mt-4 text-4xl md:text-5xl">
            Recurring{" "}
            <span className="italic-wonk text-[color:var(--ember)]">
              companions.
            </span>
          </h1>
          <p className="mt-5 font-[var(--font-newsreader)] text-[15.5px] leading-relaxed text-foreground/70">
            Characters the storyteller has met across your children&rsquo;s
            tales. Edit descriptions to guide how the AI portrays them, or
            remove any that have outstayed their welcome.
          </p>
        </header>

        <CharacterVault initialData={data} />
      </div>
    </section>
  );
}
