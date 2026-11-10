import { vi } from "vitest";

/** jsdom has no matchMedia; ui's popovers ask it which layout to open in. */
export const stubMatchMedia = (matches = false): void => {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches,
    media: query,
    onchange: null,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false,
  }));
};
