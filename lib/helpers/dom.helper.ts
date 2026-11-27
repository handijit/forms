// Focus and scroll for fields. Called only from event paths, never during render or on the
// server.

const FOCUSABLE =
  'input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])';

/** The element itself when it takes focus, otherwise its first focusable descendant. */
export const focusTarget = (element: HTMLElement): HTMLElement | null =>
  element.matches(FOCUSABLE) || element.hasAttribute("tabindex")
    ? element
    : element.querySelector<HTMLElement>(FOCUSABLE);

const prefersReducedMotion = (): boolean =>
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Scrolls the element to the middle of the view and focuses it without a second jump. */
export const revealAndFocus = (element: HTMLElement): void => {
  if (typeof element.scrollIntoView === "function") {
    element.scrollIntoView({
      block: "center",
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
  }
  element.focus({ preventScroll: true });
};

/** Sorts elements into document order. */
export const byDocumentOrder = (a: Node, b: Node): number =>
  a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;

/** Runs after the browser has painted the state that was just committed. */
export const afterPaint = (callback: () => void): void => {
  if (typeof requestAnimationFrame === "function") {
    requestAnimationFrame(() => callback());
  } else {
    setTimeout(callback, 0);
  }
};
