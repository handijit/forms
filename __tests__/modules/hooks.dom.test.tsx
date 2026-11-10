import { act, render, renderHook, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { describe, expect, test, vi } from "vitest";
import { z } from "zod";

import {
  numberFormat,
  useField,
  useFieldFormat,
  useForm,
  useFormState,
  useRegisterField,
} from "../../lib/index";

const schema = z.object({ email: z.email("Geçersiz"), amount: z.number() });

describe("the hooks", () => {
  test("should return the whole state without a selector", () => {
    const { result } = renderHook(() => {
      const form = useForm({
        schema,
        defaultValues: { email: "", amount: 1 },
        onSubmit: vi.fn(),
      });
      return { form, state: useFormState(form) };
    });
    expect(result.current.state).toBe(result.current.form.getState());
    act(() => result.current.form.setValue("email", "a"));
    expect(result.current.state.values.email).toBe("a");
  });

  test("should run a field validator given to useField, with the latest function", async () => {
    const user = userEvent.setup();
    const calls: string[] = [];
    const Host = ({ taken }: { taken: string }): ReactElement => {
      const form = useForm({
        schema,
        defaultValues: { email: "", amount: 1 },
        onSubmit: vi.fn(),
        mode: "blur",
      });
      const field = useField(form, "email", {
        validate: async (value) => {
          calls.push(value);
          return value === taken ? "Bu e-posta kayıtlı" : undefined;
        },
      });
      return (
        <>
          <input aria-label="E-posta" {...field.inputProps} />
          <span data-testid="state">
            {field.isValidating ? "kontrol" : (field.error ?? "")}
          </span>
        </>
      );
    };
    const { rerender } = render(<Host taken="x@y.co" />);
    rerender(<Host taken="a@b.co" />);
    await user.type(screen.getByLabelText("E-posta"), "a@b.co");
    await user.tab();
    expect(await screen.findByText("Bu e-posta kayıtlı")).toBeTruthy();
    expect(calls).toEqual(["a@b.co"]);
  });

  test("should register a control by hand, with or without a label", () => {
    const { result, rerender } = renderHook(
      ({ label }: { label?: string }) => {
        const form = useForm({
          schema,
          defaultValues: { email: "", amount: 1 },
          onSubmit: vi.fn(),
        });
        useRegisterField(form, "email", {
          getElement: () => null,
          ...(label === undefined ? {} : { label }),
        });
        return form;
      },
      { initialProps: {} }
    );
    expect(result.current.getFieldLabel("email")).toBeUndefined();
    rerender({ label: "E-posta" });
    expect(result.current.getFieldLabel("email")).toBe("E-posta");
  });

  test("should mask an input without a caret position", () => {
    const { result } = renderHook(() => {
      const form = useForm({
        schema,
        defaultValues: { email: "", amount: 1 },
        onSubmit: vi.fn(),
      });
      return {
        form,
        text: useFieldFormat(useField(form, "amount"), numberFormat()),
      };
    });
    const target = {
      value: "12345",
      selectionStart: null,
      setSelectionRange: vi.fn(),
    };
    act(() => result.current.text.onChange({ target }));
    expect(target.value).toBe("12.345");
    expect(target.setSelectionRange).toHaveBeenCalledWith(6, 6);
    expect(result.current.form.getValue("amount")).toBe(12345);
  });
});
