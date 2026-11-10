import { useContext, type ReactElement } from "react";
import {
  FormContext,
  useErrorSummary,
  type FieldValues,
  type FormApi,
} from "@handijit/forms";
import Alert from "@handijit/ui/alert";
import TextLink from "@handijit/ui/text-link";

export type ErrorSummaryProps<TValues = FieldValues> = {
  /** The form; the nearest `<Form>` when left out. */
  form?: FormApi<TValues>;
  /** The heading of the summary. */
  title?: string;
  className?: string;
};

/**
 * ui's danger `Alert` listing every error after a failed submit. Field errors link to their
 * field; form-level errors (server errors for fields not on screen) are listed as text. The form
 * focuses it when no field can take the focus.
 */
const ErrorSummary = <TValues = FieldValues,>({
  form,
  title = "Lütfen işaretli alanları düzeltin.",
  className,
}: ErrorSummaryProps<TValues>): ReactElement | null => {
  const context = useContext(FormContext);
  const bound = (form as FormApi<FieldValues> | undefined) ?? context?.form;
  if (bound === undefined) {
    throw new Error(
      "@handijit/forms/ui: <ErrorSummary> has no form. Render it inside <Form form={form}> or pass the form prop."
    );
  }
  const { isVisible, formErrors, items, ref } = useErrorSummary(bound);
  if (!isVisible) return null;
  return (
    <div
      ref={(element) => {
        ref.current = element;
      }}
      tabIndex={-1}
      className={className}
    >
      <Alert tone="danger" title={title}>
        <ul>
          {formErrors.map((message) => (
            <li key={message}>{message}</li>
          ))}
          {items.map((item) => {
            const text =
              item.label === undefined || item.label === ""
                ? item.message
                : `${item.label}: ${item.message}`;
            return (
              <li key={item.name}>
                {item.elementId === undefined ? (
                  text
                ) : (
                  <TextLink
                    href={`#${item.elementId}`}
                    onClick={(event) => {
                      event.preventDefault();
                      item.focus();
                    }}
                  >
                    {text}
                  </TextLink>
                )}
              </li>
            );
          })}
        </ul>
      </Alert>
    </div>
  );
};

export default ErrorSummary;
