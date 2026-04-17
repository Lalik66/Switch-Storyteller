"use client";

/**
 * <ChildrenManager> — interactive child profile list + add/edit dialog.
 *
 * Renders the list handed to it by the Server Component. Edit and
 * delete call placeholder API endpoints (owned by the API agent in a
 * later phase). All localized copy ships as an inline EN/AZ table.
 */

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
// NOTE: `@/lib/schema` is owned by the schema-agent.
import { childProfile } from "@/lib/schema";
import type { InferSelectModel } from "drizzle-orm";

type ChildProfile = InferSelectModel<typeof childProfile>;

/* ── Localized copy ─────────────────────────────────────────────────── */

const COPY: Record<
  AppLang,
  {
    addChild: string;
    emptyTitle: string;
    emptyBody: string;
    dialogTitle: string;
    dialogDescription: string;
    displayName: string;
    age: string;
    strictness: string;
    strictnessHint: string;
    strictnessOptions: { value: string; label: string }[];
    allowPublish: string;
    allowRemix: string;
    dailyLimit: string;
    dailyLimitHint: string;
    cancel: string;
    save: string;
    saving: string;
    edit: string;
    delete: string;
    deleteConfirm: string;
    minutesLabel: string;
    yearsLabel: string;
    saveFailed: string;
    deleteFailed: string;
  }
> = {
  en: {
    addChild: "Add a child",
    emptyTitle: "No scribes yet.",
    emptyBody:
      "Add your first child to set their age, reading strictness, and daily time limit.",
    dialogTitle: "A new little scribe",
    dialogDescription:
      "These settings guide the storyteller on every page your child reads.",
    displayName: "Display name",
    age: "Age",
    strictness: "Content strictness",
    strictnessHint:
      "How gently the storyteller handles peril, sadness, and conflict.",
    strictnessOptions: [
      { value: "soft", label: "Soft (ages 6\u20138)" },
      { value: "standard", label: "Standard (ages 9\u201311)" },
      { value: "brave", label: "Brave (ages 12+)" },
    ],
    allowPublish: "Allow publishing to the shared library",
    allowRemix: "Allow other children to remix their tales",
    dailyLimit: "Daily minute limit",
    dailyLimitHint: "Leave blank for no limit.",
    cancel: "Cancel",
    save: "Save scribe",
    saving: "Saving\u2026",
    edit: "Edit",
    delete: "Delete",
    deleteConfirm: "Delete this child profile? This cannot be undone.",
    minutesLabel: "min/day",
    yearsLabel: "yrs",
    saveFailed: "Could not save. Try again.",
    deleteFailed: "Could not delete. Try again.",
  },
  az: {
    addChild: "Uşaq əlavə et",
    emptyTitle: "Hələ yazıçı yoxdur.",
    emptyBody:
      "Yaşını, məzmun sərtliyini və günlük vaxt limitini təyin etmək üçün ilk uşağını əlavə et.",
    dialogTitle: "Yeni kiçik yazıçı",
    dialogDescription:
      "Bu parametrlər uşağın oxuduğu hər səhifədə nağılçıya rəhbərlik edir.",
    displayName: "Görünən ad",
    age: "Yaş",
    strictness: "Məzmun sərtliyi",
    strictnessHint:
      "Nağılçının təhlükə, kədər və münaqişəni necə yumşaq ifadə etməsi.",
    strictnessOptions: [
      { value: "soft", label: "Yumşaq (6\u20138 yaş)" },
      { value: "standard", label: "Standart (9\u201311 yaş)" },
      { value: "brave", label: "Cəsur (12+ yaş)" },
    ],
    allowPublish: "Ümumi kitabxanada nəşrə icazə ver",
    allowRemix: "Digər uşaqlara nağılları remikslərə icazə ver",
    dailyLimit: "Günlük dəqiqə limiti",
    dailyLimitHint: "Limit yoxdursa, boş burax.",
    cancel: "Ləğv et",
    save: "Yadda saxla",
    saving: "Saxlanılır\u2026",
    edit: "Redaktə et",
    delete: "Sil",
    deleteConfirm: "Bu uşaq profili silinsin? Geri qaytarıla bilməz.",
    minutesLabel: "dəq/gün",
    yearsLabel: "yaş",
    saveFailed: "Saxlanılmadı. Yenə cəhd et.",
    deleteFailed: "Silinmədi. Yenə cəhd et.",
  },
};

/* ── Form model ─────────────────────────────────────────────────────── */

type Strictness = "soft" | "standard" | "brave";

type ChildForm = {
  id?: string;
  displayName: string;
  age: string;
  contentStrictness: Strictness;
  allowPublish: boolean;
  allowRemix: boolean;
  dailyMinuteLimit: string;
};

const EMPTY_FORM: ChildForm = {
  displayName: "",
  age: "",
  contentStrictness: "standard",
  allowPublish: false,
  allowRemix: false,
  dailyMinuteLimit: "",
};

/**
 * Defensive reader: the schema-agent's column names may land as either
 * camelCase or snake_case. Read whichever is present.
 */
function readField<T>(
  row: ChildProfile,
  camel: string,
  snake: string,
  fallback: T
): T {
  const record = row as unknown as Record<string, unknown>;
  const value = record[camel] ?? record[snake];
  return (value as T | undefined) ?? fallback;
}

/* ── Component ──────────────────────────────────────────────────────── */

export function ChildrenManager({
  initialChildren,
}: {
  initialChildren: ChildProfile[];
}) {
  const { lang } = useLanguage();
  const t = COPY[lang];

  const [children, setChildren] = useState<ChildProfile[]>(initialChildren);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<ChildForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const openForNew = () => {
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openForEdit = (row: ChildProfile) => {
    const id = readField<string | undefined>(row, "id", "id", undefined);
    setForm({
      ...(id !== undefined ? { id } : {}),
      displayName: readField<string>(row, "displayName", "display_name", ""),
      age: String(readField<number | string>(row, "age", "age", "")),
      contentStrictness: readField<Strictness>(
        row,
        "contentStrictness",
        "content_strictness",
        "standard"
      ),
      allowPublish: readField<boolean>(
        row,
        "allowPublish",
        "allow_publish",
        false
      ),
      allowRemix: readField<boolean>(
        row,
        "allowRemix",
        "allow_remix",
        false
      ),
      dailyMinuteLimit: String(
        readField<number | string>(
          row,
          "dailyMinuteLimit",
          "daily_minute_limit",
          ""
        )
      ),
    });
    setDialogOpen(true);
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload = {
      displayName: form.displayName.trim(),
      age: Number(form.age) || 0,
      contentStrictness: form.contentStrictness,
      allowPublish: form.allowPublish,
      allowRemix: form.allowRemix,
      dailyMinuteLimit: form.dailyMinuteLimit
        ? Number(form.dailyMinuteLimit)
        : null,
    };

    setSubmitting(true);
    try {
      // TODO(api-agent): /api/children is not in Phase 1 scope. The
      // sibling API agent will land POST and PATCH handlers.
      const url = form.id ? `/api/children/${form.id}` : "/api/children";
      const method = form.id ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Save failed: ${res.status}`);
      }

      const saved = (await res.json()) as ChildProfile;
      setChildren((prev) => {
        if (form.id) {
          return prev.map((row) =>
            readField<string | undefined>(row, "id", "id", undefined) ===
            form.id
              ? saved
              : row
          );
        }
        return [...prev, saved];
      });
      setDialogOpen(false);
    } catch (err) {
      console.error(err);
      toast.error(t.saveFailed);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (row: ChildProfile) => {
    const id = readField<string | undefined>(row, "id", "id", undefined);
    if (!id) return;
    if (typeof window !== "undefined" && !window.confirm(t.deleteConfirm)) {
      return;
    }
    try {
      // TODO(api-agent): DELETE /api/children/:id not in Phase 1 scope.
      const res = await fetch(`/api/children/${id}`, { method: "DELETE" });
      if (!res.ok) {
        throw new Error(`Delete failed: ${res.status}`);
      }
      setChildren((prev) =>
        prev.filter(
          (r) =>
            readField<string | undefined>(r, "id", "id", undefined) !== id
        )
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
              {t.addChild}
            </Button>
          </DialogTrigger>
          <ChildDialogContent
            t={t}
            form={form}
            setForm={setForm}
            submitting={submitting}
            onSubmit={handleSave}
          />
        </Dialog>
      </div>

      {children.length === 0 ? (
        <article className="card-stamp p-10 text-center">
          <p className="eyebrow text-foreground/55">{t.emptyTitle}</p>
          <p className="mt-4 font-[var(--font-newsreader)] text-[15.5px] italic leading-relaxed text-foreground/70">
            {t.emptyBody}
          </p>
        </article>
      ) : (
        <ul className="flex flex-col gap-4">
          {children.map((row) => {
            const id =
              readField<string | undefined>(row, "id", "id", undefined) ??
              readField<string>(row, "displayName", "display_name", "");
            const displayName = readField<string>(
              row,
              "displayName",
              "display_name",
              "\u2014"
            );
            const age = readField<number | string>(row, "age", "age", "\u2014");
            const strictness = readField<Strictness>(
              row,
              "contentStrictness",
              "content_strictness",
              "standard"
            );
            const dailyLimit = readField<number | null>(
              row,
              "dailyMinuteLimit",
              "daily_minute_limit",
              null
            );
            return (
              <li key={id}>
                <article className="card-stamp flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[color:var(--ember)] font-[var(--font-fraunces)] text-xl italic text-[color:var(--primary-foreground)]">
                      {displayName.charAt(0).toUpperCase() || "?"}
                    </div>
                    <div>
                      <h2 className="text-xl leading-tight">{displayName}</h2>
                      <dl className="mt-2 flex flex-wrap items-baseline gap-x-5 gap-y-1 font-[var(--font-newsreader)] text-[14px] text-foreground/70">
                        <div className="flex items-baseline gap-1.5">
                          <dt className="eyebrow">{t.age}</dt>
                          <dd>
                            {age} {t.yearsLabel}
                          </dd>
                        </div>
                        <div className="flex items-baseline gap-1.5">
                          <dt className="eyebrow">{t.strictness}</dt>
                          <dd className="capitalize">{strictness}</dd>
                        </div>
                        {dailyLimit != null && (
                          <div className="flex items-baseline gap-1.5">
                            <dt className="eyebrow">{t.dailyLimit}</dt>
                            <dd>
                              {dailyLimit} {t.minutesLabel}
                            </dd>
                          </div>
                        )}
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
      )}
    </>
  );
}

/* ── Dialog form ────────────────────────────────────────────────────── */

function ChildDialogContent({
  t,
  form,
  setForm,
  submitting,
  onSubmit,
}: {
  t: (typeof COPY)[AppLang];
  form: ChildForm;
  setForm: (next: ChildForm) => void;
  submitting: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
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
        <div className="flex flex-col gap-2">
          <Label htmlFor="display-name">{t.displayName}</Label>
          <Input
            id="display-name"
            value={form.displayName}
            onChange={(e) =>
              setForm({ ...form, displayName: e.target.value })
            }
            required
            maxLength={40}
            autoFocus
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="age">{t.age}</Label>
            <Input
              id="age"
              type="number"
              min={3}
              max={17}
              value={form.age}
              onChange={(e) => setForm({ ...form, age: e.target.value })}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="daily-limit">{t.dailyLimit}</Label>
            <Input
              id="daily-limit"
              type="number"
              min={0}
              max={600}
              value={form.dailyMinuteLimit}
              onChange={(e) =>
                setForm({ ...form, dailyMinuteLimit: e.target.value })
              }
              placeholder="\u2014"
            />
            <p className="font-[var(--font-newsreader)] text-[13px] italic text-foreground/55">
              {t.dailyLimitHint}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="strictness">{t.strictness}</Label>
          {/* Native select — no new shadcn primitive added. Styled to
              match the Input primitive. */}
          <select
            id="strictness"
            value={form.contentStrictness}
            onChange={(e) =>
              setForm({
                ...form,
                contentStrictness: e.target.value as Strictness,
              })
            }
            className="border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
          >
            {t.strictnessOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <p className="font-[var(--font-newsreader)] text-[13px] italic text-foreground/55">
            {t.strictnessHint}
          </p>
        </div>

        <div className="flex flex-col gap-3 rounded-md border border-border/60 bg-[color:var(--card)] p-4">
          <label className="flex items-center gap-3 text-[14px]">
            <input
              type="checkbox"
              checked={form.allowPublish}
              onChange={(e) =>
                setForm({ ...form, allowPublish: e.target.checked })
              }
              className="h-4 w-4 accent-[color:var(--ember)]"
            />
            <span>{t.allowPublish}</span>
          </label>
          <label className="flex items-center gap-3 text-[14px]">
            <input
              type="checkbox"
              checked={form.allowRemix}
              onChange={(e) =>
                setForm({ ...form, allowRemix: e.target.checked })
              }
              className="h-4 w-4 accent-[color:var(--ember)]"
            />
            <span>{t.allowRemix}</span>
          </label>
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
