import { act, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { describe, expect, test } from "vitest";
import { z } from "zod";

import { useField, useFieldFormat, useFormContext } from "../lib/index";
import { dateFormat, moneyFormat } from "../lib/tr";
import { renderForm } from "./fixtures/ui";

// Bugs found while porting @handijit/forms 1.1.0 to @handijitcom/forms 1.0.0.
describe("1.0.0", () => {
  test("leaving a field erased text its format could not read", async () => {
    const Price = (): ReactElement => {
      const form = useFormContext<{ price?: number; date: string }>();
      const price = useFieldFormat(useField(form, "price"), moneyFormat);
      const date = useFieldFormat(useField(form, "date"), dateFormat);
      return (
        <>
          <input aria-label="Fiyat" {...price} />
          <input aria-label="Tarih" {...date} />
        </>
      );
    };
    const { user, form } = renderForm(
      {
        schema: z.object({ price: z.number().optional(), date: z.iso.date() }),
        defaultValues: { date: "" },
      },
      <Price />
    );
    const price = screen.getByLabelText("Fiyat") as HTMLInputElement;
    await user.type(price, "1.23");
    await user.tab();
    expect(price.value).toBe("1.23");
    expect(form.getValue("price")).toBeNaN();

    const date = screen.getByLabelText("Tarih") as HTMLInputElement;
    await user.type(date, "3104");
    await user.tab();
    expect(date.value).toBe("31.04");
    act(() => form.setValue("date", "2026-12-31"));
    expect(date.value).toBe("31.12.2026");
  });
});
