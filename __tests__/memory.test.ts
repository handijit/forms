import { describe, expect, test, vi } from "vitest";
import { z } from "zod";

import createFormStore from "../lib/core/create-form-store";

const schema = z.object({
  name: z.string().min(1),
  items: z.array(z.object({ title: z.string() })),
});

const setup = () =>
  createFormStore({ name: "", items: [] as { title: string }[] }, () => ({
    schema,
    mode: "change" as const,
    onSubmit: vi.fn(),
  }));

describe("memory", () => {
  test("should keep no listener or registration after their owners leave", () => {
    const form = setup();
    for (let i = 0; i < 10_000; i += 1) {
      const unsubscribe = form.subscribe(() => {});
      const unregister = form.registerField("name", {
        getElement: () => null,
        label: `Ad ${i}`,
      });
      const unregisterSummary = form.registerSummary(() => null);
      unsubscribe();
      unregister();
      unregisterSummary();
    }
    const listener = vi.fn();
    form.subscribe(listener);
    form.setValue("name", "x");
    expect(listener).toHaveBeenCalledTimes(1);
    expect(form.getFieldLabel("name")).toBeUndefined();
  });

  test("should not grow its row keys past the rows", () => {
    const form = setup();
    const items = form.array("items");
    for (let i = 0; i < 1_000; i += 1) {
      items.append({ title: String(i) });
      items.remove(0);
    }
    expect(form.getArrayKeys("items")).toHaveLength(0);
    expect(form.getState().values.items).toHaveLength(0);
  });

  test("should leave no timer behind after a change in change mode", () => {
    vi.useFakeTimers();
    const form = setup();
    for (let i = 0; i < 100; i += 1) form.setValue("name", String(i));
    expect(vi.getTimerCount()).toBe(0);
  });
});
