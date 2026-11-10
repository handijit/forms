import { afterEach, vi } from "vitest";

// Testing Library unmounts after each test by itself only when the test runner exposes globals;
// this one does not, so the cleanup is explicit.
afterEach(async () => {
  vi.useRealTimers();
  if (typeof document !== "undefined") {
    const { cleanup } = await import("@testing-library/react");
    cleanup();
  }
});
