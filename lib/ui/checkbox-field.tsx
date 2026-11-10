import type { ReactElement } from "react";
import type { FieldValues } from "@handijit/forms";
import Checkbox from "@handijit/ui/checkbox";

import ToggleField, {
  type BooleanPath,
  type ToggleFieldProps,
} from "./toggle-field";

export type CheckboxFieldProps<
  TValues = FieldValues,
  P extends BooleanPath<TValues> = BooleanPath<TValues>,
> = ToggleFieldProps<TValues, P, typeof Checkbox>;

/** ui's `Checkbox` bound to a boolean field; the error appears below it. */
const CheckboxField = <
  TValues = FieldValues,
  P extends BooleanPath<TValues> = BooleanPath<TValues>,
>(
  props: CheckboxFieldProps<TValues, P>
): ReactElement => (
  <ToggleField {...(props as CheckboxFieldProps)} control={Checkbox} />
);

export default CheckboxField;
