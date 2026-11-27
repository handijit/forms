import type { ComponentProps, ReactElement } from "react";
import type { FieldValues } from "@handijitcom/forms";
import PercentInput from "@handijitcom/ui/percent-input";

import ScaledField, {
  type NumberPath,
  type ScaledControl,
  type ScaledOwnedProps,
} from "./scaled-field";
import type { FramedBinderProps } from "./ui.type";

export type PercentFieldProps<
  TValues = FieldValues,
  P extends NumberPath<TValues> = NumberPath<TValues>,
> = FramedBinderProps<TValues, P> &
  Omit<ComponentProps<typeof PercentInput>, ScaledOwnedProps>;

/**
 * ui's `PercentInput` in a `Field`, bound to a number field: hundredths of a percent, so `2000`
 * reads `%20` and `1250` reads `%12,5`. An empty field is `null`.
 */
const PercentField = <
  TValues = FieldValues,
  P extends NumberPath<TValues> = NumberPath<TValues>,
>(
  props: PercentFieldProps<TValues, P>
): ReactElement => (
  <ScaledField
    {...(props as PercentFieldProps)}
    control={PercentInput as unknown as ScaledControl}
  />
);

export default PercentField;
