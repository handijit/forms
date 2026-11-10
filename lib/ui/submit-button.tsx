import { useContext, type ComponentProps, type ReactElement } from "react";
import {
  FormContext,
  useFormState,
  type FieldValues,
  type FormApi,
} from "@handijit/forms";
import Button from "@handijit/ui/button";

export type SubmitButtonProps<TValues = FieldValues> = Omit<
  ComponentProps<typeof Button>,
  "type" | "isLoading" | "form" | "href"
> & {
  /** The form; the nearest `<Form>` when left out. */
  form?: FormApi<TValues>;
};

const selectSubmitting = (state: { isSubmitting: boolean }): boolean =>
  state.isSubmitting;

/** ui's `Button` as the form's submit button: busy (and inert) while the form submits. */
const SubmitButton = <TValues = FieldValues,>({
  form,
  children = "Kaydet",
  disabled,
  ...buttonProps
}: SubmitButtonProps<TValues>): ReactElement => {
  const context = useContext(FormContext);
  const bound = (form as FormApi<FieldValues> | undefined) ?? context?.form;
  if (bound === undefined) {
    throw new Error(
      "@handijit/forms/ui: <SubmitButton> has no form. Render it inside <Form form={form}> or pass the form prop."
    );
  }
  const isSubmitting = useFormState(bound, selectSubmitting, Object.is);
  return (
    <Button
      {...buttonProps}
      type="submit"
      isLoading={isSubmitting}
      disabled={disabled ?? context?.isDisabled}
    >
      {children}
    </Button>
  );
};

export default SubmitButton;
