import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Testing Library registers its cleanup and act environment only when test globals exist; the
// tests import the Vitest API explicitly, so both are set here.
(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

// jsdom has no matchMedia; ui's Select and Combobox ask it whether to open as a bottom sheet.
// Defined, not stubbed: a test may stub it and Vitest restores this one afterwards.
Object.defineProperty(window, "matchMedia", {
  configurable: true,
  writable: true,
  value: (query: string): MediaQueryList =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList,
});

afterEach(() => {
  cleanup();
});
