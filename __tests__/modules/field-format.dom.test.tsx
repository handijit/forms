import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { describe, expect, test, vi } from "vitest";
import { z } from "zod";

import {
  numberFormat,
  useField,
  useFieldFormat,
  useForm,
  type FieldFormat,
  type FormApi,
} from "../../lib/index";

const schema = z.object({ amount: z.number().optional(), code: z.string() });
type Values = z.input<typeof schema>;

const upper: FieldFormat<string> = {
  parse: (text) => text,
  format: (value) => value ?? "",
};

const Host = ({
  formRef,
}: {
  formRef: { current: FormApi<Values> | null };
}): ReactElement => {
  const form = useForm({
    schema,
    defaultValues: { amount: 1234, code: "" },
    onSubmit: vi.fn(),
  });
  formRef.current = form;
  const amount = useField(form, "amount");
  const code = useField(form, "code");
  const amountText = useFieldFormat(amount, numberFormat({ decimals: 2 }));
  const codeText = useFieldFormat(code, upper);
  return (
    <>
      <input aria-label="Tutar" {...amountText} />
      <input aria-label="Kod" {...codeText} />
    </>
  );
};

describe("useFieldFormat", () => {
  test("should show the value formatted and store the parsed value while typing", async () => {
    const user = userEvent.setup();
    const formRef: { current: FormApi<Values> | null } = { current: null };
    render(<Host formRef={formRef} />);
    const input = screen.getByLabelText("Tutar") as HTMLInputElement;
    expect(input.value).toBe("1.234");
    await user.clear(input);
    await user.type(input, "98765,4");
    expect(input.value).toBe("98.765,4");
    expect(formRef.current?.getValue("amount")).toBe(98765.4);
  });

  test("should keep the caret among the digits when the mask regroups", async () => {
    const user = userEvent.setup();
    const formRef: { current: FormApi<Values> | null } = { current: null };
    render(<Host formRef={formRef} />);
    const input = screen.getByLabelText("Tutar") as HTMLInputElement;
    // Caret after "1", before ".234": typing 9 gives 19.234 with the caret after the 9.
    input.setSelectionRange(1, 1);
    await user.type(input, "9", {
      initialSelectionStart: 1,
      initialSelectionEnd: 1,
    });
    expect(input.value).toBe("19.234");
    expect(input.selectionStart).toBe(2);
  });

  test("should normalise on blur and follow values set from outside", async () => {
    const user = userEvent.setup();
    const formRef: { current: FormApi<Values> | null } = { current: null };
    render(<Host formRef={formRef} />);
    const input = screen.getByLabelText("Tutar") as HTMLInputElement;
    await user.clear(input);
    await user.type(input, "5,");
    await user.tab();
    expect(input.value).toBe("5");
    act(() => formRef.current?.setValue("amount", 42.5));
    expect(input.value).toBe("42,5");
    act(() => formRef.current?.reset());
    expect(input.value).toBe("1.234");
  });

  test("should pass text straight through without a mask", async () => {
    const user = userEvent.setup();
    const formRef: { current: FormApi<Values> | null } = { current: null };
    render(<Host formRef={formRef} />);
    const input = screen.getByLabelText("Kod") as HTMLInputElement;
    await user.type(input, "ab");
    expect(formRef.current?.getValue("code")).toBe("ab");
  });
});
