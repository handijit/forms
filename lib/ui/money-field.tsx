import type { ComponentProps, ReactElement } from "react";
import type { FieldValues } from "@handijitcom/forms";
import MoneyInput from "@handijitcom/ui/money-input";

import ScaledField, {
  type NumberPath,
  type ScaledControl,
  type ScaledOwnedProps,
} from "./scaled-field";
import type { FramedBinderProps } from "./ui.type";

export type MoneyFieldProps<
  TValues = FieldValues,
  P extends NumberPath<TValues> = NumberPath<TValues>,
> = FramedBinderProps<TValues, P> &
  Omit<ComponentProps<typeof MoneyInput>, ScaledOwnedProps>;

/**
 * ui's `MoneyInput` in a `Field`, bound to a number field: the amount in the currency's minor
 * unit (kuruş for TRY), so `123450` with `minorDigits={2}` reads `1.234,50`. An empty field is
 * `null`.
 */
const MoneyField = <
  TValues = FieldValues,
  P extends NumberPath<TValues> = NumberPath<TValues>,
>(
  props: MoneyFieldProps<TValues, P>
): ReactElement => (
  <ScaledField
    {...(props as MoneyFieldProps)}
    control={MoneyInput as unknown as ScaledControl}
  />
);

export default MoneyField;
