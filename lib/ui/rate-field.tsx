import type { ComponentProps, ReactElement } from "react";
import type { FieldValues } from "@handijitcom/forms";
import RateInput from "@handijitcom/ui/rate-input";

import ScaledField, {
  type NumberPath,
  type ScaledControl,
  type ScaledOwnedProps,
} from "./scaled-field";
import type { FramedBinderProps } from "./ui.type";

export type RateFieldProps<
  TValues = FieldValues,
  P extends NumberPath<TValues> = NumberPath<TValues>,
> = FramedBinderProps<TValues, P> &
  Omit<ComponentProps<typeof RateInput>, ScaledOwnedProps>;

/**
 * ui's `RateInput` in a `Field`, bound to a number field: an exchange rate in millionths, so
 * `34123456` reads `34,123456`. An empty field is `null`.
 */
const RateField = <
  TValues = FieldValues,
  P extends NumberPath<TValues> = NumberPath<TValues>,
>(
  props: RateFieldProps<TValues, P>
): ReactElement => (
  <ScaledField
    {...(props as RateFieldProps)}
    control={RateInput as unknown as ScaledControl}
  />
);

export default RateField;
