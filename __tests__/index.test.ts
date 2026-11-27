import { describe, expect, test } from "vitest";

import * as core from "../lib/index";
import * as tr from "../lib/tr";
import * as ui from "../lib/ui";

const CORE_EXPORTS = [
  "DEFAULT_MESSAGES",
  "Form",
  "FormContext",
  "numberFormat",
  "useErrorSummary",
  "useField",
  "useFieldArray",
  "useFieldFormat",
  "useForm",
  "useFormContext",
  "useFormState",
  "useRegisterField",
  "useUnsavedChanges",
  "useWatch",
] as const;

const UI_EXPORTS = [
  "CheckboxField",
  "ChipGroupField",
  "ComboboxField",
  "DateField",
  "DateRangeField",
  "ErrorSummary",
  "FileUploadField",
  "MoneyField",
  "NumberField",
  "PasswordField",
  "PercentField",
  "QuantityField",
  "QuantityInputField",
  "RadioCardGroupField",
  "RadioGroupField",
  "RangeSliderField",
  "RateField",
  "RatingField",
  "SegmentedField",
  "SelectField",
  "SubmitButton",
  "SwitchField",
  "TagInputField",
  "TextField",
  "TextareaField",
  "fieldsOf",
] as const;

const TR_EXPORTS = [
  "TR_MESSAGES",
  "dateFormat",
  "ibanFormat",
  "moneyFormat",
  "phoneFormat",
  "tcknFormat",
  "vknFormat",
] as const;

describe("public entry points", () => {
  test.each([
    ["@handijitcom/forms", core, CORE_EXPORTS],
    ["@handijitcom/forms/ui", ui, UI_EXPORTS],
    ["@handijitcom/forms/tr", tr, TR_EXPORTS],
  ] as const)(
    "%s should expose exactly the documented surface",
    (_, entry, names) => {
      expect(Object.keys(entry).sort()).toEqual([...names].sort());
    }
  );

  test("should freeze the default texts", () => {
    expect(Object.isFrozen(core.DEFAULT_MESSAGES)).toBe(true);
    expect(core.DEFAULT_MESSAGES).toEqual({
      submitFailed: "Form gönderilemedi. Lütfen tekrar deneyin.",
      serverFieldError: "Bu alanı kontrol edin.",
    });
  });

  test("should hand every binder from fieldsOf, untouched", () => {
    const fields = ui.fieldsOf(null as never);
    for (const name of UI_EXPORTS.filter(
      (binder) => !["ErrorSummary", "SubmitButton", "fieldsOf"].includes(binder)
    )) {
      expect(fields[name as keyof typeof fields]).toBe(ui[name]);
    }
    expect(Object.isFrozen(fields)).toBe(true);
  });
});
