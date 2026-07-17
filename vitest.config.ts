import { defineConfig } from "vitest/config";

// Minimal Vitest setup. Scope is intentionally narrow: pure-function unit
// tests only (no jsdom, no route-handler harness yet). The `@` alias mirrors
// tsconfig so tests import modules the same way the app does.
export default defineConfig({
  resolve: {
    alias: {
      "@": new URL("./src", import.meta.url).pathname,
    },
  },
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
});
