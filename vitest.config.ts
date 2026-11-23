import path from "node:path";

import { defineConfig } from "vitest/config";

export default defineConfig({
  define: {
    __APP_COMMIT__: JSON.stringify("test"),
    __APP_VERSION__: JSON.stringify("0.0.0-test"),
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src/client"),
      "@shared": path.resolve(import.meta.dirname, "src/shared"),
    },
  },
  test: {
    include: ["src/**/*.test.ts", "scripts/**/*.test.ts"],
    environment: "node",
  },
});
