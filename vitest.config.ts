import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/integration/**/*.test.ts"],
    pool: "forks",
    testTimeout: 45_000,
    hookTimeout: 45_000
  }
});
