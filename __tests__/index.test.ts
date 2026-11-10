import { describe, expect, test } from "vitest";

import * as core from "../lib/index";
import * as tr from "../lib/tr";
import * as ui from "../lib/ui";

const names = (module: object): string[] => Object.keys(module).sort();

describe("the public API", () => {
  test("sentinel: the core entry should export exactly its documented names", () => {
    expect(names(core)).toEqual([
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
    ]);
  });

  test("sentinel: the ui entry should export exactly its documented names", () => {
    expect(names(ui)).toEqual([
      "CheckboxField",
      "ChipGroupField",
      "ComboboxField",
      "DateField",
      "DateRangeField",
      "ErrorSummary",
      "FileUploadField",
      "NumberField",
      "PasswordField",
      "QuantityField",
      "RadioCardGroupField",
      "RadioGroupField",
      "RangeSliderField",
      "RatingField",
      "SegmentedField",
      "SelectField",
      "SubmitButton",
      "SwitchField",
      "TagInputField",
      "TextField",
      "TextareaField",
      "fieldsOf",
    ]);
  });

  test("sentinel: the tr entry should export exactly its documented names", () => {
    expect(names(tr)).toEqual([
      "dateFormat",
      "ibanFormat",
      "moneyFormat",
      "phoneFormat",
      "tcknFormat",
      "vknFormat",
    ]);
  });

  test("should ship frozen default texts in Turkish", () => {
    expect(Object.isFrozen(core.DEFAULT_MESSAGES)).toBe(true);
    expect(core.DEFAULT_MESSAGES.submitFailed).toMatch(/gönderilemedi/);
  });
});
