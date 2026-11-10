import { onTestFinished, vi } from "vitest";

/**
 * For a test that expects a render to throw: React logs the error and jsdom reports it as an
 * uncaught window error; both are expected, so both are kept off the test output.
 */
export const silenceRenderErrors = (): void => {
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  const swallow = (event: ErrorEvent): void => event.preventDefault();
  window.addEventListener("error", swallow);
  onTestFinished(() => window.removeEventListener("error", swallow));
};
