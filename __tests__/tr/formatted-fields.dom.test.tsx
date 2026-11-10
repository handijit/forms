import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { isValidPhone } from "@handijit/tr";
import { describe, expect, test } from "vitest";
import { z } from "zod";

import { moneyFormat, phoneFormat } from "../../lib/tr";
import { TextField } from "../../lib/ui";
import { renderForm } from "../support/render-form";

const schema = z.object({
  phone: z.string().refine(isValidPhone, "Geçerli bir telefon girin"),
  price: z.number({ error: "Fiyat girin" }).positive(),
});

describe("formatted ui fields", () => {
  test("should mask a phone while typing and store E.164", async () => {
    const user = userEvent.setup();
    const { form } = renderForm({
      schema,
      defaultValues: { phone: "", price: undefined as never },
      children: (
        <>
          <TextField
            name="phone"
            label="Telefon"
            format={phoneFormat}
            inputMode="tel"
          />
          <TextField
            name="price"
            label="Fiyat"
            format={moneyFormat}
            suffix="TL"
          />
        </>
      ),
    });
    const phone = screen.getByLabelText(/Telefon/) as HTMLInputElement;
    await user.type(phone, "5321234567");
    expect(phone.value).toBe("532 123 45 67");
    expect(form().getValue("phone")).toBe("+905321234567");
    await user.tab();
    expect(phone.value).toBe("0532 123 45 67");
    const price = screen.getByLabelText(/Fiyat/) as HTMLInputElement;
    await user.type(price, "1250,5");
    await user.tab();
    expect(price.value).toBe("1.250,50");
    expect(form().getValue("price")).toBe(125050);
  });
});
