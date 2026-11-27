import { afterEach, describe, expect, test, vi } from "vitest";
import { z } from "zod";

import createFormStore from "../lib/core/create-form-store";

const schema = z.object({
  first: z.string().min(1, "Birinci gerekli"),
  second: z.string().min(1, "İkinci gerekli"),
});

const setup = () =>
  createFormStore({ first: "", second: "" }, () => ({
    schema,
    onSubmit: vi.fn(),
  }));

// afterPaint waits for an animation frame; both clocks are faked.
const fakeClock = (): void => {
  vi.useFakeTimers({
    toFake: [
      "setTimeout",
      "clearTimeout",
      "requestAnimationFrame",
      "cancelAnimationFrame",
    ],
  });
};

const byId = (id: string) => (): HTMLElement | null =>
  document.getElementById(id);

afterEach(() => {
  document.body.innerHTML = "";
});

describe("createFormStore: focus", () => {
  test("should focus the first invalid field in document order after a failed submit", async () => {
    fakeClock();
    document.body.innerHTML =
      '<input id="first" /><div id="wrap"><span></span></div><input id="second" />';
    const form = setup();
    // Registered in reverse order: document order decides, not registration order.
    form.registerField("second", { getElement: byId("second") });
    form.registerField("first", { getElement: byId("missing") });
    form.registerField("first", { getElement: byId("wrap") });
    form.registerField("first", { getElement: byId("first") });
    await form.handleSubmit();
    vi.runAllTimers();
    expect(document.activeElement?.id).toBe("first");
  });

  test("should skip fields without an error and focus the summary when no field can take it", async () => {
    fakeClock();
    document.body.innerHTML =
      '<input id="first" value="x" /><div id="summary" tabindex="-1"></div>';
    const form = setup();
    form.setValue("first", "x");
    form.registerField("first", { getElement: byId("first") });
    form.registerSummary(() => null);
    form.registerSummary(byId("summary"));
    await form.handleSubmit();
    vi.runAllTimers();
    expect(document.activeElement?.id).toBe("summary");
    expect(form.getFieldElement("first")?.id).toBe("first");
  });

  test("should focus one registered field on demand", () => {
    document.body.innerHTML =
      '<div id="group"><button>Seç</button></div><div id="empty"></div>';
    const form = setup();
    form.registerField("first", { getElement: byId("group") });
    form.registerField("second", { getElement: byId("empty") });
    expect(form.focusField("first")).toBe(true);
    expect(document.activeElement?.textContent).toBe("Seç");
    expect(form.focusField("second")).toBe(false);
  });

  test("should focus the first marked field after server errors", () => {
    fakeClock();
    document.body.innerHTML = '<input id="first" /><input id="second" />';
    const form = setup();
    form.registerField("first", { getElement: byId("first") });
    form.registerField("second", { getElement: byId("second") });
    form.applyServerErrors({ second: "Sunucu" });
    vi.runAllTimers();
    expect(document.activeElement?.id).toBe("second");
  });
});
