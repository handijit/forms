import { useMemo, type ReactElement } from "react";
import {
  numberFormat,
  type FieldPath,
  type FieldValues,
} from "@handijit/forms";

import TextField, { type TextFieldProps } from "./text-field";

export type NumberFieldProps<
  TValues = FieldValues,
  P extends FieldPath<TValues> = FieldPath<TValues>,
> = Omit<TextFieldProps<TValues, P>, "format" | "type" | "inputMode"> & {
  /** Digits after the decimal comma; whole numbers when left out. */
  decimals?: number;
  allowNegative?: boolean;
};

/** A number typed the Turkish way (`1.234,5`): ui's `Input` with `numberFormat`. */
const NumberField = <
  TValues = FieldValues,
  P extends FieldPath<TValues> = FieldPath<TValues>,
>({
  decimals = 0,
  allowNegative = false,
  ...props
}: NumberFieldProps<TValues, P>): ReactElement => {
  const format = useMemo(
    () => numberFormat({ decimals, allowNegative }),
    [decimals, allowNegative]
  );
  return (
    <TextField<TValues, P>
      {...props}
      format={format}
      inputMode={decimals > 0 ? "decimal" : "numeric"}
      autoComplete={props.autoComplete ?? "off"}
    />
  );
};

export default NumberField;
