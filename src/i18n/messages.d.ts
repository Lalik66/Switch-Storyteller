/**
 * Type-safe message keys for `next-intl`.
 *
 * Augments the global `IntlMessages` interface with the shape of our
 * canonical English messages file. `useTranslations()` and
 * `getTranslations()` then narrow their key argument to valid paths,
 * so typos and stale keys surface at compile time instead of runtime.
 *
 * The Azerbaijani file is checked against this same shape implicitly:
 * if you add a key here without translating it in `messages/az.json`,
 * next-intl falls back to the English string and logs a console
 * warning — typecheck stays clean. PR 3 will add a CI step to flag
 * untranslated keys.
 */

import type messages from "../../messages/en.json";

type IntlMessagesShape = typeof messages;

declare global {
  interface IntlMessages extends IntlMessagesShape {}
}

export {};
