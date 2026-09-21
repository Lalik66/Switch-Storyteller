/**
 * Extract the trailing "→ …" action choices from a story page's AI content.
 *
 * The storyteller ends every page with exactly three choices, each on its
 * own line prefixed with "→ " (see `story-prompts.ts`). The reader uses
 * this parser to drive the interactive buttons instead of generic labels.
 */

const CHOICE_LINE = /^\s*(?:→|->)\s*(.+)\s*$/;

/** Lines that sit between the prose and the choice block — safe to trim. */
function isChoiceBlockTrailer(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return true;
  if (trimmed === "---") return true;
  if (/^\*.*\*$/.test(trimmed)) return true;
  if (/what (does|will|should|would)/i.test(trimmed)) return true;
  if (/növbəti/i.test(trimmed)) return true;
  return false;
}

export type ParsedStoryPage = {
  /** Story prose with the trailing choice block removed. */
  prose: string;
  /** Up to three choice labels, in display order. */
  choices: string[];
};

/**
 * Split a page's raw `aiContent` into readable prose and button labels.
 * When no arrow-prefixed lines are found, returns the full text and an
 * empty `choices` array so callers can fall back to generic buttons.
 */
export function parseStoryChoices(content: string): ParsedStoryPage {
  const lines = content.split("\n");
  const choices: string[] = [];

  let i = lines.length - 1;
  while (i >= 0) {
    const line = lines[i];
    if (line === undefined) break;
    const match = line.match(CHOICE_LINE);
    if (match?.[1]) {
      choices.unshift(match[1].trim());
      i -= 1;
      if (choices.length >= 3) break;
    } else if (choices.length > 0) {
      // A blank line between choices is common (some models separate the
      // arrow lines with an empty line, especially on the longer AZ path).
      // Skip it and keep scanning up so all three choices are captured and
      // none of the earlier arrow lines leak back into the rendered prose.
      if (line.trim() === "") {
        i -= 1;
        continue;
      }
      break;
    } else {
      i -= 1;
    }
  }

  if (choices.length === 0) {
    return { prose: content, choices: [] };
  }

  const proseLines = lines.slice(0, i + 1);
  while (proseLines.length > 0) {
    const lastLine = proseLines[proseLines.length - 1];
    if (lastLine === undefined || !isChoiceBlockTrailer(lastLine)) break;
    proseLines.pop();
  }

  return {
    prose: proseLines.join("\n").trimEnd(),
    choices,
  };
}
