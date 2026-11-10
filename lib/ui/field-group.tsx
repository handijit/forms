import type { FocusEvent, ReactElement, ReactNode } from "react";
import type { FieldChildProps } from "@handijit/ui/field";

import hasLeft from "./has-left";

type Props = {
  onLeave: () => void;
  children: ReactNode;
  /**
   * `radiogroup`: the wrapper IS the control (ui has no radio group component), so it takes the
   * links of ui's `Field` (`a11y`): the id, the invalid state, the error and hint, required.
   * `group`: only a name for a control made of several named parts (a date range).
   */
  role?: "radiogroup" | "group";
  label?: string;
  a11y?: FieldChildProps;
  className?: string;
};

/**
 * Wraps a composite control (several focusable parts, or no blur event of its own): the field is
 * left when focus moves out of the whole group, not between its parts.
 */
const FieldGroup = ({
  onLeave,
  children,
  role,
  label,
  a11y,
  className,
}: Props): ReactElement => {
  const onBlur = (event: FocusEvent<HTMLDivElement>): void => {
    if (hasLeft(event)) onLeave();
  };
  const semantics =
    role === "radiogroup" && a11y !== undefined
      ? {
          id: a11y.id,
          role,
          "aria-label": label,
          "aria-invalid": a11y["aria-invalid"],
          "aria-describedby": a11y["aria-describedby"],
          "aria-required": a11y.required,
        }
      : role === "group"
        ? { role, "aria-label": label }
        : {};
  return (
    <div className={className} {...semantics} onBlur={onBlur}>
      {children}
    </div>
  );
};

export default FieldGroup;
