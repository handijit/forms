import type { ReactElement } from "react";
import type { FieldPath, FormApi } from "@handijit/forms";

import CheckboxField, { type CheckboxFieldProps } from "./checkbox-field";
import ChipGroupField, { type ChipGroupFieldProps } from "./chip-group-field";
import ComboboxField, { type ComboboxFieldProps } from "./combobox-field";
import DateField, { type DateFieldProps } from "./date-field";
import DateRangeField, { type DateRangeFieldProps } from "./date-range-field";
import FileUploadField, {
  type FileUploadFieldProps,
} from "./file-upload-field";
import NumberField, { type NumberFieldProps } from "./number-field";
import PasswordField, { type PasswordFieldProps } from "./password-field";
import QuantityField, { type QuantityFieldProps } from "./quantity-field";
import RadioCardGroupField, {
  type RadioCardGroupFieldProps,
} from "./radio-card-group-field";
import RadioGroupField, {
  type RadioGroupFieldProps,
} from "./radio-group-field";
import RangeSliderField, {
  type RangeSliderFieldProps,
} from "./range-slider-field";
import RatingField, { type RatingFieldProps } from "./rating-field";
import SegmentedField, { type SegmentedFieldProps } from "./segmented-field";
import SelectField, { type SelectFieldProps } from "./select-field";
import SwitchField, { type SwitchFieldProps } from "./switch-field";
import TagInputField, { type TagInputFieldProps } from "./tag-input-field";
import TextField, { type TextFieldProps } from "./text-field";
import TextareaField, { type TextareaFieldProps } from "./textarea-field";
import type { BooleanPath } from "./toggle-field";

type Typed<TProps> = (props: TProps) => ReactElement;

/** Every binder with its `name` typed for one form, and without the `form` prop. */
export type FieldsOf<TValues> = {
  TextField: <P extends FieldPath<TValues>>(
    props: Omit<TextFieldProps<TValues, P>, "form">
  ) => ReactElement;
  NumberField: <P extends FieldPath<TValues>>(
    props: Omit<NumberFieldProps<TValues, P>, "form">
  ) => ReactElement;
  TextareaField: <P extends FieldPath<TValues>>(
    props: Omit<TextareaFieldProps<TValues, P>, "form">
  ) => ReactElement;
  PasswordField: <P extends FieldPath<TValues>>(
    props: Omit<PasswordFieldProps<TValues, P>, "form">
  ) => ReactElement;
  SelectField: <P extends FieldPath<TValues>>(
    props: Omit<SelectFieldProps<TValues, P>, "form">
  ) => ReactElement;
  ComboboxField: <P extends FieldPath<TValues>>(
    props: Omit<ComboboxFieldProps<TValues, P>, "form">
  ) => ReactElement;
  CheckboxField: <P extends BooleanPath<TValues>>(
    props: Omit<CheckboxFieldProps<TValues, P>, "form">
  ) => ReactElement;
  SwitchField: <P extends BooleanPath<TValues>>(
    props: Omit<SwitchFieldProps<TValues, P>, "form">
  ) => ReactElement;
  RadioGroupField: <P extends FieldPath<TValues>>(
    props: Omit<RadioGroupFieldProps<TValues, P>, "form">
  ) => ReactElement;
  RadioCardGroupField: <P extends FieldPath<TValues>>(
    props: Omit<RadioCardGroupFieldProps<TValues, P>, "form">
  ) => ReactElement;
  DateField: <P extends FieldPath<TValues>>(
    props: Omit<DateFieldProps<TValues, P>, "form">
  ) => ReactElement;
  DateRangeField: Typed<Omit<DateRangeFieldProps<TValues>, "form">>;
  QuantityField: Typed<Omit<QuantityFieldProps<TValues>, "form">>;
  SegmentedField: <P extends FieldPath<TValues>>(
    props: Omit<SegmentedFieldProps<TValues, P>, "form">
  ) => ReactElement;
  ChipGroupField: <P extends FieldPath<TValues>>(
    props: Omit<ChipGroupFieldProps<TValues, P>, "form">
  ) => ReactElement;
  RangeSliderField: Typed<Omit<RangeSliderFieldProps<TValues>, "form">>;
  RatingField: Typed<Omit<RatingFieldProps<TValues>, "form">>;
  TagInputField: Typed<Omit<TagInputFieldProps<TValues>, "form">>;
  FileUploadField: Typed<Omit<FileUploadFieldProps<TValues>, "form">>;
};

const FIELDS = /*#__PURE__*/ Object.freeze({
  TextField,
  NumberField,
  TextareaField,
  PasswordField,
  SelectField,
  ComboboxField,
  CheckboxField,
  SwitchField,
  RadioGroupField,
  RadioCardGroupField,
  DateField,
  DateRangeField,
  QuantityField,
  SegmentedField,
  ChipGroupField,
  RangeSliderField,
  RatingField,
  TagInputField,
  FileUploadField,
});

/**
 * The binders typed for `form`, so that `name` is checked without a `form` prop on every field:
 * `const f = fieldsOf(form); <f.TextField name="email" label="E-posta" />`. The same components,
 * only typed; render them inside `<Form form={form}>`. It references every binder, so a
 * bundler keeps them all; import the binders one by one where size matters.
 */
const fieldsOf = <TValues>(form: FormApi<TValues>): FieldsOf<TValues> => {
  void form;
  return FIELDS as unknown as FieldsOf<TValues>;
};

export default fieldsOf;
