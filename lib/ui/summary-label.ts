import type { ReactNode } from "react";

/** The label the error summary lists: `summaryLabel`, else the label when it is plain text. */
const summaryLabelOf = (
  label: ReactNode,
  summaryLabel: string | undefined
): string | undefined =>
  summaryLabel ?? (typeof label === "string" ? label : undefined);

export default summaryLabelOf;
