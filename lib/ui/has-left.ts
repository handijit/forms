import type { FocusEvent } from "react";

/** The blur moved focus out of the element that heard it, not to one of its parts. */
const hasLeft = (event: FocusEvent<HTMLElement>): boolean => {
  const next = event.relatedTarget;
  return !(next instanceof Node && event.currentTarget.contains(next));
};

export default hasLeft;
