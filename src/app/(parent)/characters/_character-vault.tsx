"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { useLanguage, type AppLang } from "@/components/language-provider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { character, childProfile } from "@/lib/schema";
import type { ChildWithCharacters } from "./page";
import type { InferSelectModel } from "drizzle-orm";

type Character = InferSelectModel<typeof character>;
type ChildProfile = InferSelectModel<typeof childProfile>;

const COPY: Record<
  AppLang,
  {
    empty: string;
    emptyHint: string;
    addCharacter: string;
    dialogTitle: string;
    dialogDescription: string;
    name: string;
    description: string;
    descriptionHint: string;
    cancel: string;
    save: string;
    saving: string;
    edit: string;
    delete: string;
    deleteConfirm: string;
    saveFailed: string;
    deleteFailed: string;
    appearances: string;
    childLabel: string;
    selectChild: string;
  }
> = {
  en: {
    empty: "No characters yet.",
    emptyHint:
      "Characters are discovered automatically as your children write stories. You can also add them manually.",
    addCharacter: "Add a character",
    dialogTitle: "A new companion",
    dialogDescription:
      "Describe this character so the storyteller stays consistent across tales.",
    name: "Character name",
    description: "Description",
    descriptionHint:
      "Physical appearance, personality, or notable traits (1–2 sentences).",
    cancel: "Cancel",
    save: "Save",
    saving: "Saving…",
    edit: "Edit",
    delete: "Delete",
    deleteConfirm: "Remove this character? They won’t appear in future stories.",
    saveFailed: "Could not save. Try again.",
    deleteFailed: "Could not delete. Try again.",
    appearances: "appearances",
    childLabel: "Child",
    selectChild: "Select a child",
  },
  az: {
    empty: "Hələ heç bir personaj yoxdur.",
    emptyHint:
      "Personajlar uşaqlarınız hekayə yazdıqca avtomatik aşkar edilir. Əl ilə də əlavə edə bilərsiniz.",
    addCharacter: "Personaj əlavə et",
    dialogTitle: "Yeni yoldaş",
    dialogDescription:
      "Bu personajı təsvir edin ki, nağılçı hekayələr arasında ardıcıl qalsın.",
    name: "Personajın adı",
    description: "Təsvir",
    descriptionHint:
      "Xarici görünüş, şəxsiyyət və ya diqqətəlayiq xüsusiyyətlər (1–2 cümlə).",
    cancel: "Ləğv et",
    save: "Yadda saxla",
    saving: "Saxlanılır…",
    edit: "Redaktə et",
    delete: "Sil",
    deleteConfirm: "Bu personaj silinsin? Gələcək hekayələrdə görünməyəcək.",
    saveFailed: "Saxlanılmadı. Yenə cəhd et.",
    deleteFailed: "Silinmədi. Yenə cəhd et.",
    appearances: "görünüş",
    childLabel: "Uşaq",
    selectChild: "Uşaq seçin",
  },
};

type CharForm = {
  id?: string;
  childProfileId: string;
  name: string;
  description: string;
};

const EMPTY_FORM: CharForm = {
  childProfileId: "",
  name: "",
  description: "",
};

function readField<T>(
  row: Character,
  camel: string,
  snake: string,
  fallback: T,
): T {
  const record = row as unknown as Record<string, unknown>;
  const value = record[camel] ?? record[snake];
  return (value as T | undefined) ?? fallback;
}

function readChildField<T>(
  row: ChildProfile,
  camel: string,
  snake: string,
  fallback: T,
): T {
  const record = row as unknown as Record<string, unknown>;
  const value = record[camel] ?? record[snake];
  return (value as T | undefined) ?? fallback;
}

export function CharacterVault({
  initialData,
}: {
  initialData: ChildWithCharacters[];
}) {
  const { lang } = useLanguage();
  const t = COPY[lang];

  const [data, setData] = useState(initialData);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<CharForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const allCharacters = data.flatMap((d) =>
    d.characters.map((c) => ({ ...c, childName: readChildField(d.child, "displayName", "display_name", "") }))
  );

  const openForNew = () => {
    setForm({
      ...EMPTY_FORM,
      childProfileId: data.length === 1 && data[0]
        ? readChildField(data[0].child, "id", "id", "")
        : "",
    });
    setDialogOpen(true);
  };

  const openForEdit = (row: Character) => {
    setForm({
      id: readField(row, "id", "id", ""),
      childProfileId: readField(row, "childProfileId", "child_profile_id", ""),
      name: readField(row, "name", "name", ""),
      description: readField(row, "description", "description", ""),
    });
    setDialogOpen(true);
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload = form.id
      ? { name: form.name.trim(), description: form.description.trim() }
      : {
          childProfileId: form.childProfileId,
          name: form.name.trim(),
          description: form.description.trim(),
        };

    setSubmitting(true);
    try {
      const url = form.id
        ? `/api/characters/${form.id}`
        : "/api/characters";
      const method = form.id ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`Save failed: ${res.status}`);

      const saved = (await res.json()) as Character;
      const savedChildId = readField(saved, "childProfileId", "child_profile_id", "");

      setData((prev) =>
        prev.map((entry) => {
          const entryChildId = readChildField(entry.child, "id", "id", "");
          if (entryChildId !== savedChildId) return entry;

          if (form.id) {
            return {
              ...entry,
              characters: entry.characters.map((c) =>
                readField(c, "id", "id", "") === form.id ? saved : c
              ),
            };
          }
          return { ...entry, characters: [...entry.characters, saved] };
        })
      );
      setDialogOpen(false);
    } catch (err) {
      console.error(err);
      toast.error(t.saveFailed);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (row: Character) => {
    const id = readField(row, "id", "id", "");
    if (!id) return;
    if (typeof window !== "undefined" && !window.confirm(t.deleteConfirm)) {
      return;
    }
    try {
      const res = await fetch(`/api/characters/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`Delete failed: ${res.status}`);

      setData((prev) =>
        prev.map((entry) => ({
          ...entry,
          characters: entry.characters.filter(
            (c) => readField(c, "id", "id", "") !== id
          ),
        }))
      );
    } catch (err) {
      console.error(err);
      toast.error(t.deleteFailed);
    }
  };

  return (
    <>
      <div className="mb-8 flex items-center justify-end gap-4">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              type="button"
              onClick={openForNew}
              className="btn-ember justify-center"
            >
              {t.addCharacter}
            </Button>
          </DialogTrigger>
          <CharacterDialogContent
            t={t}
            form={form}
            setForm={setForm}
            submitting={submitting}
            onSubmit={handleSave}
            childProfiles={data.map((d) => d.child)}
          />
        </Dialog>
      </div>

      {allCharacters.length === 0 ? (
        <article className="card-stamp p-10 text-center">
          <p className="eyebrow text-foreground/55">{t.empty}</p>
          <p className="mt-4 font-[var(--font-newsreader)] text-[15.5px] italic leading-relaxed text-foreground/70">
            {t.emptyHint}
          </p>
        </article>
      ) : (
        <div className="flex flex-col gap-6">
          {data.map((entry) => {
            const childId = readChildField(entry.child, "id", "id", "");
            const childName = readChildField(
              entry.child,
              "displayName",
              "display_name",
              "—"
            );

            if (entry.characters.length === 0) return null;

            return (
              <div key={childId}>
                <p className="eyebrow mb-3">
                  {childName}&rsquo;s companions
                </p>
                <ul className="flex flex-col gap-3">
                  {entry.characters.map((row) => {
                    const id = readField(row, "id", "id", "");
                    const name = readField(row, "name", "name", "—");
                    const desc = readField(
                      row,
                      "description",
                      "description",
                      ""
                    );
                    const count = readField<number>(
                      row,
                      "appearanceCount",
                      "appearance_count",
                      0
                    );

                    return (
                      <li key={id}>
                        <article className="card-stamp flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
                          <div className="flex items-start gap-4">
                            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[color:var(--ember)] font-[var(--font-fraunces)] text-xl italic text-[color:var(--primary-foreground)]">
                              {name.charAt(0).toUpperCase() || "?"}
                            </div>
                            <div>
                              <h2 className="text-xl leading-tight">{name}</h2>
                              <p className="mt-1 font-[var(--font-newsreader)] text-[14px] leading-relaxed text-foreground/70">
                                {desc}
                              </p>
                              <dl className="mt-2 flex flex-wrap items-baseline gap-x-5 gap-y-1 font-[var(--font-newsreader)] text-[13px] text-foreground/55">
                                <div className="flex items-baseline gap-1.5">
                                  <dd>
                                    {count} {t.appearances}
                                  </dd>
                                </div>
                              </dl>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() => openForEdit(row)}
                              className="eyebrow"
                            >
                              {t.edit}
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() => handleDelete(row)}
                              className="eyebrow text-[color:var(--destructive)] hover:text-[color:var(--destructive)]"
                            >
                              {t.delete}
                            </Button>
                          </div>
                        </article>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

function CharacterDialogContent({
  t,
  form,
  setForm,
  submitting,
  onSubmit,
  childProfiles,
}: {
  t: (typeof COPY)[AppLang];
  form: CharForm;
  setForm: (next: CharForm) => void;
  submitting: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  childProfiles: ChildProfile[];
}) {
  const showChildPicker = !form.id && childProfiles.length > 1;

  return (
    <DialogContent className="sm:max-w-xl">
      <DialogHeader>
        <DialogTitle className="font-[var(--font-fraunces)] text-2xl">
          {t.dialogTitle}
        </DialogTitle>
        <DialogDescription className="font-[var(--font-newsreader)] text-[14px] italic text-foreground/60">
          {t.dialogDescription}
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        {showChildPicker && (
          <div className="flex flex-col gap-2">
            <Label htmlFor="child-select">{t.childLabel}</Label>
            <select
              id="child-select"
              value={form.childProfileId}
              onChange={(e) =>
                setForm({ ...form, childProfileId: e.target.value })
              }
              required
              className="border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
            >
              <option value="">{t.selectChild}</option>
              {childProfiles.map((child) => {
                const id = readChildField(child, "id", "id", "");
                const name = readChildField(
                  child,
                  "displayName",
                  "display_name",
                  "—"
                );
                return (
                  <option key={id} value={id}>
                    {name}
                  </option>
                );
              })}
            </select>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <Label htmlFor="char-name">{t.name}</Label>
          <Input
            id="char-name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            maxLength={80}
            autoFocus
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="char-desc">{t.description}</Label>
          <Textarea
            id="char-desc"
            value={form.description}
            onChange={(e) =>
              setForm({ ...form, description: e.target.value })
            }
            required
            maxLength={500}
            rows={3}
          />
          <p className="font-[var(--font-newsreader)] text-[13px] italic text-foreground/55">
            {t.descriptionHint}
          </p>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="ghost" className="eyebrow">
              {t.cancel}
            </Button>
          </DialogClose>
          <Button
            type="submit"
            disabled={submitting}
            className="btn-ember justify-center disabled:opacity-50"
          >
            {submitting ? t.saving : t.save}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
