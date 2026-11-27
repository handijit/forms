import type { ComponentProps, ReactElement } from "react";
import type { FieldValues } from "@handijitcom/forms";
import QuantityInput from "@handijitcom/ui/quantity-input";

import ScaledField, {
  type NumberPath,
  type ScaledControl,
  type ScaledOwnedProps,
} from "./scaled-field";
import type { FramedBinderProps } from "./ui.type";

export type QuantityInputFieldProps<
  TValues = FieldValues,
  P extends NumberPath<TValues> = NumberPath<TValues>,
> = FramedBinderProps<TValues, P> &
  Omit<ComponentProps<typeof QuantityInput>, ScaledOwnedProps>;

/**
 * ui's `QuantityInput` in a `Field`, bound to a number field: ten-thousandths of the unit, so
 * `25000` reads `2,5` (kg, adet…). An empty field is `null`. For whole pieces with two buttons
 * use `QuantityField`.
 */
const QuantityInputField = <
  TValues = FieldValues,
  P extends NumberPath<TValues> = NumberPath<TValues>,
>(
  props: QuantityInputFieldProps<TValues, P>
): ReactElement => (
  <ScaledField
    {...(props as QuantityInputFieldProps)}
    control={QuantityInput as unknown as ScaledControl}
  />
);

export default QuantityInputField;
