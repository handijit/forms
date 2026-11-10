import type { ReactElement } from "react";
import type { FieldValues } from "@handijit/forms";
import Switch from "@handijit/ui/switch";

import ToggleField, {
  type BooleanPath,
  type ToggleFieldProps,
} from "./toggle-field";

export type SwitchFieldProps<
  TValues = FieldValues,
  P extends BooleanPath<TValues> = BooleanPath<TValues>,
> = ToggleFieldProps<TValues, P, typeof Switch>;

/** ui's `Switch` bound to a boolean field; the error appears below it. */
const SwitchField = <
  TValues = FieldValues,
  P extends BooleanPath<TValues> = BooleanPath<TValues>,
>(
  props: SwitchFieldProps<TValues, P>
): ReactElement => (
  <ToggleField {...(props as SwitchFieldProps)} control={Switch} />
);

export default SwitchField;
