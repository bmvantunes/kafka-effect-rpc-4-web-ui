import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";

const dirname =
  typeof __dirname !== "undefined"
    ? __dirname
    : path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    projects: [
      {
        extends: true,
        plugins: [
          storybookTest({
            configDir: path.join(dirname, ".storybook"),
            storybookScript: "npm run storybook -- --ci --no-open",
            storybookUrl: "http://127.0.0.1:6006",
            tags: {
              include: ["test"]
            }
          })
        ],
        test: {
          name: "storybook",
          globalSetup: ["./vitest.global-setup.ts"],
          testTimeout: 45_000,
          maxWorkers: 1,
          fileParallelism: false,
          sequence: {
            concurrent: false
          },
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [{ browser: "chromium" }]
          },
          setupFiles: ["./.storybook/vitest.setup.ts"]
        }
      }
    ]
  }
});
