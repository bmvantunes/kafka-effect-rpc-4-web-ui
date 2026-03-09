import { spawn } from "node:child_process";
import { once } from "node:events";

const controllerCommand = [
  "node",
  "--import",
  "tsx",
  "./scripts/storybook-controller.ts"
];
const storybookArgs = process.argv.slice(2);

const waitForController = async () => {
  const deadline = Date.now() + 15_000;

  while (Date.now() < deadline) {
    try {
      const response = await fetch("http://127.0.0.1:6011/health");

      if (response.ok) {
        return;
      }
    } catch {}

    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  throw new Error("storybook controller did not become healthy");
};

const controller = spawn(controllerCommand[0], controllerCommand.slice(1), {
  cwd: process.cwd(),
  env: process.env,
  stdio: "inherit"
});

const stopChildren = (signal = "SIGTERM") => {
  if (!controller.killed) {
    controller.kill(signal);
  }
};

process.on("SIGINT", () => stopChildren("SIGINT"));
process.on("SIGTERM", () => stopChildren("SIGTERM"));

try {
  await waitForController();
} catch (error) {
  stopChildren("SIGTERM");
  throw error;
}

const storybook = spawn(
  "./node_modules/.bin/storybook",
  ["dev", "-p", process.env.STORYBOOK_PORT ?? "6006", ...storybookArgs],
  {
    cwd: process.cwd(),
    env: process.env,
    stdio: "inherit"
  }
);

const [code] = await once(storybook, "exit");
stopChildren("SIGTERM");
process.exit(code ?? 0);
