/**
 * Canonical LLM system and user prompts for The Hero's Forge story loop.
 *
 * This module is the single source of truth for prompt text, per PRD
 * §10 Layer 2 ("a single canonical system prompt ... injected by both
 * story and remix routes so there is one source of truth"). Keeping
 * prompts out of route handlers lets us unit-test them in isolation
 * and makes A/B experiments straightforward.
 *
 * All functions in this file are pure — they take plain arguments and
 * return a string. They have no external dependencies so they are safe
 * to import from any runtime (Node, Edge, or tests).
 */

/**
 * Supported narration languages for Phase 1 (PRD §6).
 */
type Lang = "en" | "az";

/**
 * Content strictness level configured on `child_profile.content_strictness`.
 * "strict" parents get an even narrower deny-list in the system prompt.
 */
type Strictness = "standard" | "strict";

/**
 * The deny-list shared by both standard and strict strictness modes.
 * These categories are always off-limits regardless of parent settings.
 * The wording is deliberately concrete — LLMs follow specific bans
 * ("no swords, guns, knives, or explosions") more reliably than abstract
 * ones ("no violence").
 */
const BASE_DENY_LIST = [
  "No physical violence of any kind — no swords, guns, knives, fists, explosions, blood, or injury.",
  "No weapons as plot devices, even as cartoonish props. Replace with tools, musical instruments, or puzzles.",
  "No romance, kissing, dating, crushes, or adult relationships. Friendship only.",
  "No scary imagery — no monsters lurking in the dark, no jump scares, no body horror, no death.",
  "No requests for the child's personal information (real name beyond the chosen hero name, age, school, address, phone, email, photo).",
  "No references to real-world brands, celebrities, politicians, or current events.",
  "No alcohol, tobacco, drugs, gambling, or any adult substances.",
  "No bathroom humor, insults, name-calling, or mean-spirited teasing.",
];

/**
 * Extra rules layered on top of the base deny-list when the parent has
 * set `content_strictness = 'strict'`.
 */
const STRICT_EXTRA_DENY_LIST = [
  "No mild peril at all. The hero should never feel truly afraid, cornered, or in danger.",
  "No conflict between characters beyond gentle misunderstandings that resolve within the same page.",
  "No magical creatures with fangs, claws, or predatory behavior. Only friendly, soft-edged creatures.",
];

/**
 * Localized language-instruction line. Placed at the very top of the
 * system prompt because LLMs weigh early tokens more heavily.
 */
function languageInstruction(lang: Lang): string {
  if (lang === "az") {
    return "Respond ONLY in Azerbaijani (Azərbaycan dili). Every sentence of the story, every action button label, and every piece of narration must be in natural, child-friendly Azerbaijani. Do not mix in English words except for proper names the child has chosen.";
  }
  return "Respond ONLY in English. Every sentence of the story, every action button label, and every piece of narration must be in natural, child-friendly English.";
}

/**
 * Map a child's age to a concrete vocabulary ceiling instruction.
 * The Phase 1 target audience is 6–11 year olds. We clamp vocabulary
 * at a 4th–5th grade ceiling per PRD §10 regardless of age so older
 * siblings reading along still get age-appropriate material.
 */
function vocabularyCeiling(childAge: number): string {
  // Clamp to defend against malformed inputs; schema validation happens
  // at the route layer but prompts should never crash on bad data.
  const safeAge = Number.isFinite(childAge)
    ? Math.max(4, Math.min(14, Math.trunc(childAge)))
    : 8;

  return [
    `The reader is approximately ${safeAge} years old.`,
    "Use vocabulary no more advanced than a 4th–5th grade reading level (US) / Year 5–6 (UK).",
    "Prefer short sentences (8–14 words). Vary sentence length for rhythm but never exceed 20 words.",
    "When introducing any uncommon word, immediately define it in-story using a short appositive phrase.",
  ].join(" ");
}

/**
 * Build the canonical story system prompt. This string is injected as
 * the `system` role in every LLM call made by `src/app/api/story/**`.
 *
 * The prompt has a fixed section order — do not reorder without testing:
 *
 *   1. Language instruction (highest-weight tokens).
 *   2. Role / persona framing.
 *   3. Length and structure rules.
 *   4. Vocabulary ceiling.
 *   5. Deny-list (base + strict if applicable).
 *   6. Output format contract.
 *
 * Callers compose this with one of the user-prompt builders below.
 */
export function STORY_SYSTEM_PROMPT(
  lang: Lang,
  childAge: number,
  strictness: Strictness,
): string {
  const denyList =
    strictness === "strict"
      ? [...BASE_DENY_LIST, ...STRICT_EXTRA_DENY_LIST]
      : BASE_DENY_LIST;

  const sections: string[] = [
    // 1. Language
    languageInstruction(lang),

    // 2. Persona
    [
      "You are The Hero's Forge — a warm, imaginative co-author helping a child build their own adventure story.",
      "You are always encouraging, never judgmental. You celebrate the child's ideas and weave them into the narrative.",
      "You are G-rated at all times. Think Pixar, Studio Ghibli, or a classic picture book — wonder and warmth, not danger.",
    ].join(" "),

    // 3. Length & structure
    [
      "Each page must be approximately 120–160 words — roughly one screen of reading for a young child.",
      "End every page (except finales) with exactly three distinct, kid-friendly action choices the hero could take next.",
      "Action choices must each be a single short sentence, 3–10 words, and begin with a verb.",
      "Actions should be meaningfully different from each other — not three variations of the same idea.",
    ].join(" "),

    // 4. Vocabulary
    vocabularyCeiling(childAge),

    // 5. Deny-list
    "The following are ABSOLUTELY forbidden in any story content, action choice, or image description:\n- " +
      denyList.join("\n- "),

    // 6. Output contract
    [
      "Always write in third-person limited, present tense, centered on the hero the child named.",
      "Never break the fourth wall except in the explicit 'action choices' block.",
      "Never ask the child for personal information. Never reference the real world outside the story.",
      "If the child's input would require violating any rule above, gently steer the story elsewhere without scolding them.",
    ].join(" "),
  ];

  return sections.join("\n\n");
}

/**
 * Arguments for `STORY_PAGE_USER_PROMPT`. Kept as a single object for
 * forward-compatibility — adding an optional field will not break
 * existing call sites.
 */
export type StoryPageUserPromptArgs = {
  heroName: string;
  setting: string;
  problem: string;
  previousPages: string[];
  chosenAction?: string;
  customAction?: string;
};

/**
 * Build the user-role prompt for a mid-story page continuation.
 *
 * This is the prompt used most frequently — it runs once per button
 * tap. It intentionally restates the canonical context (hero, setting,
 * problem) on every call rather than relying on a rolling conversation,
 * because (a) OpenRouter charges per token either way and (b) it keeps
 * the route handler stateless, which simplifies retries and moderation.
 */
export function STORY_PAGE_USER_PROMPT(args: StoryPageUserPromptArgs): string {
  const { heroName, setting, problem, previousPages, chosenAction, customAction } =
    args;

  const pageNumber = previousPages.length + 1;

  const priorContext =
    previousPages.length === 0
      ? "This is the first page of the story."
      : previousPages
          .map((page, idx) => `— Page ${idx + 1}:\n${page}`)
          .join("\n\n");

  // The child either tapped one of the three action buttons or typed a
  // custom action. Custom actions take precedence so the child always
  // feels their own words matter more than the suggestions.
  let childIntent: string;
  if (customAction && customAction.trim() !== "") {
    childIntent = `The child wrote their own next action: "${customAction.trim()}". Honor the spirit of their idea while keeping it within the story's rules.`;
  } else if (chosenAction && chosenAction.trim() !== "") {
    childIntent = `The child chose this action: "${chosenAction.trim()}". Continue the story from that choice.`;
  } else {
    childIntent =
      "No action has been chosen yet — begin the opening page and end it with three action choices.";
  }

  return [
    `Story details:`,
    `- Hero: ${heroName}`,
    `- Setting: ${setting}`,
    `- Core problem: ${problem}`,
    `- Page number: ${pageNumber}`,
    ``,
    `Previous pages:`,
    priorContext,
    ``,
    childIntent,
    ``,
    `Write page ${pageNumber} now. Remember the length, vocabulary, and deny-list rules from the system prompt. End the page with exactly three action choices, each on its own line, prefixed with "→ ".`,
  ].join("\n");
}

/**
 * Arguments for `STORY_OPENER_PROMPT`. Used for chapter-opening pages
 * which are routed to the premium model tier per PRD §4.1.
 */
export type StoryOpenerPromptArgs = {
  heroName: string;
  setting: string;
  problem: string;
  chapterNumber: number;
  lang: Lang;
};

/**
 * Build the user-role prompt for a chapter opener. Chapter openers are
 * rarer (~15% of pages per PRD §4.1 cost model) and get extra
 * instructions to set scene, introduce stakes, and reference the story
 * title in a way that feels satisfying at chapter breaks.
 *
 * The `lang` arg is duplicated here (vs. being read from system prompt)
 * so the user prompt can include a short localized "Chapter N" header
 * without parsing the system prompt.
 */
export function STORY_OPENER_PROMPT(args: StoryOpenerPromptArgs): string {
  const { heroName, setting, problem, chapterNumber, lang } = args;

  // Localized chapter label. Kept as a simple switch rather than a
  // lookup table because we only have two languages.
  const chapterLabel = lang === "az" ? "Fəsil" : "Chapter";

  const openingGuidance =
    chapterNumber === 1
      ? "This is the very first chapter — introduce the hero, the setting, and hint at the problem without resolving it. Hook the reader with a vivid sensory image in the first sentence."
      : `This is ${chapterLabel} ${chapterNumber} — briefly echo where the previous chapter left off (one sentence), then raise the stakes with a new twist that keeps the core problem alive.`;

  return [
    `${chapterLabel} ${chapterNumber} opener.`,
    ``,
    `Story details:`,
    `- Hero: ${heroName}`,
    `- Setting: ${setting}`,
    `- Core problem: ${problem}`,
    ``,
    openingGuidance,
    ``,
    `Write the opener now. Keep to 120–160 words. End with exactly three action choices, each on its own line, prefixed with "→ ". Remember all rules from the system prompt.`,
  ].join("\n");
}
