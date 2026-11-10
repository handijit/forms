import { useState } from "react";

import { caretAfterMask } from "../helpers/caret.helper";
import isDeepEqual from "../helpers/is-deep-equal.helper";
import type { FieldFormat } from "../types/format.type";

/** The part of a field `useFieldFormat` needs: what `useField` returns. */
export type FormattableField<TValue> = {
  value: TValue;
  setValue: (value: TValue) => void;
  onBlur: () => void;
};

type InputLike = {
  value: string;
  selectionStart: number | null;
  setSelectionRange: (start: number, end: number) => void;
};

export type FieldFormatProps = {
  value: string;
  onChange: (event: { target: InputLike }) => void;
  onBlur: () => void;
};

/**
 * Shows a field's value as formatted text: `parse` on every keystroke, `mask` while typing,
 * `format` on blur and whenever the value changes from outside (reset, setValue). A format may
 * parse empty text to `undefined` even for a required field: the schema then reports it.
 */
const useFieldFormat = <TValue>(
  field: FormattableField<TValue>,
  { format, parse, mask }: FieldFormat<TValue | undefined>
): FieldFormatProps => {
  const [text, setText] = useState(() => format(field.value));
  const [shownValue, setShownValue] = useState(field.value);

  // A value that did not come from this input (a reset, setValue) replaces the text, during
  // render; a value this input wrote is already in `shownValue`.
  if (!isDeepEqual(shownValue, field.value)) {
    setShownValue(field.value);
    setText(format(field.value));
  }

  return {
    value: text,
    onChange: ({ target }) => {
      const raw = target.value;
      const masked = mask === undefined ? raw : mask(raw);
      if (masked !== raw) {
        // Written before React renders, so React finds the text in place and leaves the caret.
        const caret = caretAfterMask(
          raw,
          target.selectionStart ?? raw.length,
          masked
        );
        target.value = masked;
        target.setSelectionRange(caret, caret);
      }
      const value = parse(masked);
      setText(masked);
      setShownValue(value as TValue);
      field.setValue(value as TValue);
    },
    onBlur: () => {
      setText(format(parse(text)));
      field.onBlur();
    },
  };
};

export default useFieldFormat;
