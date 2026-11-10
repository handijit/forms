import axe from "axe-core";
import { expect } from "vitest";

/** Runs axe on a rendered tree; jsdom cannot measure colour, so contrast is ui's own test. */
export const expectNoAxeViolations = async (
  container: Element
): Promise<void> => {
  const results = await axe.run(container, {
    rules: { "color-contrast": { enabled: false }, region: { enabled: false } },
  });
  expect(
    results.violations.map(
      (violation) =>
        `${violation.id}: ${violation.nodes.map((node) => node.html).join(" | ")}`
    )
  ).toEqual([]);
};
