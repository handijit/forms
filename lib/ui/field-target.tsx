import type { ReactElement, ReactNode } from "react";
import { useRegisterField, type FormApi } from "@handijit/forms";

type Props = {
  form: FormApi<unknown>;
  name: string;
  /** The id ui's `Field` gave the control (or the group wrapper). */
  id: string;
  children: ReactNode;
};

/** Registers the element ui's `Field` rendered, so the form can focus it on an error. */
const FieldTarget = ({ form, name, id, children }: Props): ReactElement => {
  useRegisterField(form, name as never, {
    getElement: () => document.getElementById(id),
  });
  return <>{children}</>;
};

export default FieldTarget;
