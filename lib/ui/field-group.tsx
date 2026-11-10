import type { FocusEvent, ReactElement, ReactNode } from "react";
import type { FieldChildProps } from "@handijit/ui/field";

import hasLeft from "./has-left";

type Props = {
  /** The links ui's `Field` made; the wrapper takes the id the field label points at. */
  a11y: FieldChildProps;
  onLeave: () => void;
  children: ReactNode;
  /**
   * For controls without group semantics of their own: the wrapper becomes the named group and
   * carries the invalid state and the error link. Without it the wrapper is a plain element.
   */
  role?: "radiogroup" | "group";
  label?: string;
  className?: string;
};

/**
 * Wraps a composite control (several focusable parts, or no blur event of its own): the field is
 * left when focus moves out of the whole group, not between its parts.
 */
const FieldGroup = ({
  a11y,
  onLeave,
  children,
  role,
  label,
  className,
}: Props): ReactElement => {
  const onBlur = (event: FocusEvent<HTMLDivElement>): void => {
    if (hasLeft(event)) onLeave();
  };
  const semantics =
    role === undefined
      ? {}
      : {
          role,
          "aria-label": label,
          "aria-invalid": a11y["aria-invalid"],
          "aria-describedby": a11y["aria-describedby"],
          ...(role === "radiogroup" ? { "aria-required": a11y.required } : {}),
        };
  return (
    <div id={a11y.id} className={className} {...semantics} onBlur={onBlur}>
      {children}
    </div>
  );
};

export default FieldGroup;
