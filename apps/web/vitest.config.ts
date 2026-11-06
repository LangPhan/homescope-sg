import { defineConfig } from "vitest/config";
import path from "node:path";
export default defineConfig({
  test: { environment: "jsdom", setupFiles: ["./vitest.setup.ts"], exclude: ["e2e/**", "node_modules/**"] },
  resolve: {
    alias: {
      "@/_app": path.resolve(__dirname, "src/_app"),
      "@/_pages": path.resolve(__dirname, "src/_pages"),
      "@/entities": path.resolve(__dirname, "src/entities"),
      "@/shared": path.resolve(__dirname, "src/shared"),
    },
  },
});
