import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Only reason this file exists: the tests import through the same "@/" alias
// the app does, and vitest does not read tsconfig paths on its own.
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
});
