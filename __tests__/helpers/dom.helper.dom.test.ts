import { afterEach, describe, expect, test, vi } from "vitest";

import {
  afterPaint,
  byDocumentOrder,
  focusTarget,
  revealAndFocus,
} from "../../lib/helpers/dom.helper";

afterEach(() => {
  document.body.innerHTML = "";
});

describe("dom helpers", () => {
  test("should take the element itself when it is focusable", () => {
    document.body.innerHTML =
      '<input id="a"><div id="b" tabindex="-1"></div><div id="c"><span></span><button id="d">x</button></div><div id="e"></div>';
    const byId = (id: string) => document.getElementById(id) as HTMLElement;
    expect(focusTarget(byId("a"))).toBe(byId("a"));
    expect(focusTarget(byId("b"))).toBe(byId("b"));
    expect(focusTarget(byId("c"))).toBe(byId("d"));
    expect(focusTarget(byId("e"))).toBeNull();
  });

  test("should scroll smoothly to the middle and focus without a second jump", () => {
    document.body.innerHTML = "<input>";
    const input = document.querySelector("input") as HTMLInputElement;
    const scrollIntoView = vi.fn();
    input.scrollIntoView = scrollIntoView;
    const focus = vi.spyOn(input, "focus");
    vi.stubGlobal("matchMedia", undefined);
    revealAndFocus(input);
    expect(scrollIntoView).toHaveBeenCalledWith({
      block: "center",
      behavior: "smooth",
    });
    expect(focus).toHaveBeenCalledWith({ preventScroll: true });
  });

  test("should not animate the scroll when the user asked for less motion", () => {
    document.body.innerHTML = "<input>";
    const input = document.querySelector("input") as HTMLInputElement;
    const scrollIntoView = vi.fn();
    input.scrollIntoView = scrollIntoView;
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: query.includes("reduce"),
    }));
    revealAndFocus(input);
    expect(scrollIntoView).toHaveBeenCalledWith({
      block: "center",
      behavior: "auto",
    });
  });

  test("should still focus where scrollIntoView is missing", () => {
    document.body.innerHTML = "<input>";
    const input = document.querySelector("input") as HTMLInputElement;
    Object.defineProperty(input, "scrollIntoView", { value: undefined });
    revealAndFocus(input);
    expect(document.activeElement).toBe(input);
  });

  test("should sort elements into document order", () => {
    document.body.innerHTML = '<i id="x"></i><i id="y"></i>';
    const x = document.getElementById("x") as HTMLElement;
    const y = document.getElementById("y") as HTMLElement;
    expect([y, x].sort(byDocumentOrder)).toEqual([x, y]);
  });

  test("should run after the next frame, or after a task without frames", async () => {
    const framed = vi.fn();
    afterPaint(framed);
    await new Promise((resolve) => requestAnimationFrame(resolve));
    expect(framed).toHaveBeenCalled();
    vi.stubGlobal("requestAnimationFrame", undefined);
    vi.useFakeTimers();
    const timed = vi.fn();
    afterPaint(timed);
    vi.runAllTimers();
    expect(timed).toHaveBeenCalled();
  });
});
