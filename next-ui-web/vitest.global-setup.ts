import { spawn } from "node:child_process";
import { once } from "node:events";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getStorybookControllerUrl } from "./lib/storybook-scenario";

const dirname =
  typeof __dirname !== "undefined"
    ? __dirname
    : path.dirname(fileURLToPath(import.meta.url));

const waitForController = async (timeoutMs: number) => {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${getStorybookControllerUrl()}/health`);

      if (response.ok) {
        return;
      }
    } catch {}

    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  throw new Error("storybook controller did not become healthy");
};

export default async function globalSetup() {
  try {
    await waitForController(500);
    return;
  } catch {}

  const controller = spawn("npm", ["run", "storybook:controller"], {
    cwd: dirname,
    env: process.env,
    stdio: ["ignore", "pipe", "pipe"]
  });

  controller.stdout?.setEncoding("utf8");
  controller.stdout?.on("data", (chunk) => {
    process.stdout.write(chunk);
  });
  controller.stderr?.setEncoding("utf8");
  controller.stderr?.on("data", (chunk) => {
    process.stderr.write(chunk);
  });

  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("storybook controller did not report readiness"));
    }, 15_000);

    controller.stdout?.on("data", (chunk) => {
      if (!String(chunk).includes("storybook heartbeat controller ready")) {
        return;
      }

      clearTimeout(timer);
      resolve();
    });

    controller.once("exit", (code) => {
      clearTimeout(timer);
      reject(
        new Error(
          `storybook controller exited before becoming healthy (${code ?? 0})`
        )
      );
    });
  });

  return async () => {
    if (!controller.killed) {
      controller.kill("SIGINT");
      await once(controller, "exit").catch(() => undefined);
    }
  };
}
