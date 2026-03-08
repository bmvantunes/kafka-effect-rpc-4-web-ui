import { Effect, Fiber, Runtime } from "effect";

export const runMain = Runtime.makeRunMain(({ fiber, teardown }) => {
  const interrupt = () => {
    Effect.runFork(Fiber.interrupt(fiber));
  };

  process.on("SIGINT", interrupt);
  process.on("SIGTERM", interrupt);

  fiber.addObserver((exit) => {
    process.off("SIGINT", interrupt);
    process.off("SIGTERM", interrupt);
    teardown(exit, (code) => {
      process.exit(code);
    });
  });
});
