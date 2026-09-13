/** Smooth-scroll to an in-page anchor and sync the location hash. */
export function scrollToHashElement(
  id: string,
  options: ScrollIntoViewOptions = { behavior: "smooth", block: "start" },
): boolean {
  const element = document.getElementById(id);
  if (!element) return false;
  element.scrollIntoView(options);
  window.history.replaceState(null, "", `#${id}`);
  return true;
}

/** Parse `#id` or `/#id` into the bare element id. */
export function hashHrefToId(href: string): string | null {
  const match = href.match(/#([^/?#]+)/);
  return match?.[1] ?? null;
}
