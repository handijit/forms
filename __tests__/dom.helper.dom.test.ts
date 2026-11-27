import { afterEach, describe, expect, test, vi } from "vitest";

import {
  afterPaint,
  byDocumentOrder,
  focusTarget,
  revealAndFocus,
} from "../lib/helpers/dom.helper";

const html = (markup: string): HTMLElement => {
  document.body.innerHTML = markup;
  return document.body.firstElementChild as HTMLElement;
};

afterEach(() => {
  document.body.innerHTML = "";
});

describe("focusTarget", () => {
  test("should take the element itself when it can be focused", () => {
    const input = html("<input />");
    expect(focusTarget(input)).toBe(input);
    const group = html('<div tabindex="-1"></div>');
    expect(focusTarget(group)).toBe(group);
  });

  test("should take the first focusable descendant otherwise", () => {
    const wrapper = html(
      '<div><input type="hidden" /><button disabled></button><select></select></div>'
    );
    expect(focusTarget(wrapper)).toBe(wrapper.querySelector("select"));
    expect(focusTarget(html("<div><span></span></div>"))).toBeNull();
  });
});

describe("revealAndFocus", () => {
  test("should scroll to the middle smoothly and focus without a second jump", () => {
    vi.stubGlobal("matchMedia", undefined);
    const input = html("<input />") as HTMLInputElement;
    const scrollIntoView = vi.fn();
    input.scrollIntoView = scrollIntoView;
    const focus = vi.spyOn(input, "focus");
    revealAndFocus(input);
    expect(scrollIntoView).toHaveBeenCalledWith({
      block: "center",
      behavior: "smooth",
    });
    expect(focus).toHaveBeenCalledWith({ preventScroll: true });
    expect(document.activeElement).toBe(input);
  });

  test("should animate when the user has no motion preference", () => {
    const input = html("<input />");
    const scrollIntoView = vi.fn();
    input.scrollIntoView = scrollIntoView;
    revealAndFocus(input);
    expect(scrollIntoView).toHaveBeenCalledWith({
      block: "center",
      behavior: "smooth",
    });
  });

  test("should not animate under prefers-reduced-motion", () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({ matches: true }))
    );
    const input = html("<input />");
    const scrollIntoView = vi.fn();
    input.scrollIntoView = scrollIntoView;
    revealAndFocus(input);
    expect(scrollIntoView).toHaveBeenCalledWith({
      block: "center",
      behavior: "auto",
    });
  });

  test("should still focus where scrollIntoView is missing", () => {
    const input = html("<input />");
    Object.defineProperty(input, "scrollIntoView", { value: undefined });
    revealAndFocus(input);
    expect(document.activeElement).toBe(input);
  });
});

describe("byDocumentOrder", () => {
  test("should sort elements into document order", () => {
    const wrapper = html("<div><i id='a'></i><i id='b'></i></div>");
    const [a, b] = [...wrapper.children];
    expect(
      [b, a].sort((x, y) => byDocumentOrder(x as Node, y as Node))
    ).toEqual([a, b]);
  });
});

describe("afterPaint", () => {
  test("should wait for the next animation frame", () => {
    const frames: FrameRequestCallback[] = [];
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      frames.push(callback);
      return frames.length;
    });
    const callback = vi.fn();
    afterPaint(callback);
    expect(callback).not.toHaveBeenCalled();
    frames[0]?.(0);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  test("should fall back to a timer without animation frames", () => {
    vi.useFakeTimers();
    vi.stubGlobal("requestAnimationFrame", undefined);
    const callback = vi.fn();
    afterPaint(callback);
    vi.runAllTimers();
    expect(callback).toHaveBeenCalledTimes(1);
  });
});
