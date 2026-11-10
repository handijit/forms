import { act, render } from "@testing-library/react";
import type { ReactElement } from "react";
import { describe, expect, test, vi } from "vitest";
import { z } from "zod";

import { useForm, useUnsavedChanges, type FormApi } from "../../lib/index";

const schema = z.object({ name: z.string() });
type Values = z.input<typeof schema>;

const Host = ({
  formRef,
  blockUnload,
  onSubmit = vi.fn(),
}: {
  formRef: { current: FormApi<Values> | null };
  blockUnload?: boolean;
  onSubmit?: () => unknown;
}): ReactElement => {
  const form = useForm({ schema, defaultValues: { name: "" }, onSubmit });
  formRef.current = form;
  const hasUnsavedChanges = useUnsavedChanges(
    form,
    blockUnload === undefined ? undefined : { blockUnload }
  );
  return <p>{hasUnsavedChanges ? "kaydedilmedi" : "temiz"}</p>;
};

const unload = (): Event => {
  const event = new Event("beforeunload", { cancelable: true });
  window.dispatchEvent(event);
  return event;
};

describe("useUnsavedChanges", () => {
  test("should report unsaved changes until they are submitted", async () => {
    const formRef: { current: FormApi<Values> | null } = { current: null };
    const { container } = render(<Host formRef={formRef} />);
    expect(container.textContent).toBe("temiz");
    act(() => formRef.current?.setValue("name", "Ada"));
    expect(container.textContent).toBe("kaydedilmedi");
    // Not blocking by default.
    expect(unload().defaultPrevented).toBe(false);
    await act(async () => {
      await formRef.current?.handleSubmit();
    });
    expect(container.textContent).toBe("temiz");
  });

  test("should ask the browser to confirm leaving when asked to", () => {
    const formRef: { current: FormApi<Values> | null } = { current: null };
    const { unmount } = render(<Host formRef={formRef} blockUnload />);
    expect(unload().defaultPrevented).toBe(false);
    act(() => formRef.current?.setValue("name", "Ada"));
    expect(unload().defaultPrevented).toBe(true);
    unmount();
    expect(unload().defaultPrevented).toBe(false);
  });
});
