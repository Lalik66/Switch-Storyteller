import { describe, it, expect } from "vitest";
import { parseStoryChoices } from "./parse-story-choices";

describe("parseStoryChoices", () => {
  it("extracts three trailing arrow choices and strips the prompt block", () => {
    const content = [
      "Aziz floated toward the bay window.",
      "",
      "---",
      "",
      "*What does Aziz do next?*",
      "",
      "→ Gently pick up the creature and examine it closely.",
      "→ Check the nearby control panel for damage.",
      "→ Search the bay for clues about where the creature came from.",
    ].join("\n");

    const { prose, choices } = parseStoryChoices(content);

    expect(prose).toBe("Aziz floated toward the bay window.");
    expect(choices).toEqual([
      "Gently pick up the creature and examine it closely.",
      "Check the nearby control panel for damage.",
      "Search the bay for clues about where the creature came from.",
    ]);
  });

  it("accepts ASCII arrow variants", () => {
    const content = "The hero paused.\n-> Step forward\n-> Look around";
    const { prose, choices } = parseStoryChoices(content);

    expect(prose).toBe("The hero paused.");
    expect(choices).toEqual(["Step forward", "Look around"]);
  });

  it("returns empty choices when no arrow lines exist", () => {
    const content = "Just a plain page with no choices.";
    const { prose, choices } = parseStoryChoices(content);

    expect(prose).toBe(content);
    expect(choices).toEqual([]);
  });

  it("captures all three choices when separated by blank lines", () => {
    // Some models (esp. the longer AZ path) put a blank line between each
    // arrow. The parser must still collect all three AND keep every arrow
    // line out of the rendered prose.
    const content = [
      "The lantern flickered in the dark hall.",
      "",
      "→ Choice A",
      "",
      "→ Choice B",
      "",
      "→ Choice C",
    ].join("\n");

    const { prose, choices } = parseStoryChoices(content);

    expect(prose).toBe("The lantern flickered in the dark hall.");
    expect(choices).toEqual(["Choice A", "Choice B", "Choice C"]);
  });

  it("does not let earlier arrow lines leak into prose", () => {
    const content = [
      "A short page.",
      "",
      "→ First option",
      "→ Second option",
      "→ Third option",
    ].join("\n");

    const { prose } = parseStoryChoices(content);

    expect(prose).not.toContain("→");
    expect(prose).toBe("A short page.");
  });
});
