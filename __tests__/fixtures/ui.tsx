import { UiProvider, type UiLabels } from "@handijitcom/ui";
import { render, type RenderResult } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useEffect, type ReactElement, type ReactNode } from "react";
import { onTestFinished, vi } from "vitest";
import type { input } from "zod/v4/core";

import {
  Form,
  useForm,
  type FormApi,
  type FormProps,
  type FormSchema,
  type UseFormOptions,
} from "../../lib/index";

/** ui's interface texts, so no component warns about a missing label. */
export const LABELS: UiLabels = {
  required: "zorunlu",
  loading: "Yükleniyor",
  selectPlaceholder: "Seçin",
  passwordShow: "Şifreyi göster",
  passwordHide: "Şifreyi gizle",
  combobox: {
    searchPlaceholder: "Ara",
    emptyMessage: "Sonuç yok",
    loadingMessage: "Aranıyor",
    clearLabel: "Temizle",
  },
  quantity: { label: "Adet", decrease: "Azalt", increase: "Artır" },
  range: { min: "En az", max: "En çok" },
  tagInput: {
    added: (value) => `${value} eklendi`,
    removed: (value) => `${value} kaldırıldı`,
    duplicate: (value) => `${value} zaten ekli`,
  },
  rating: { starCount: (star) => `${star} yıldız` },
  fileUpload: {
    tooLarge: (name, max) => `${name} ${max} sınırını aşıyor`,
    uploading: (name) => `${name} yükleniyor`,
    added: (count) => `${count} dosya eklendi`,
  },
};

export const WithUi = ({ children }: { children: ReactNode }): ReactElement => (
  <UiProvider labels={LABELS}>{children}</UiProvider>
);

type HarnessOptions<TSchema extends FormSchema> = Omit<
  UseFormOptions<TSchema>,
  "onSubmit"
> & {
  onSubmit?: UseFormOptions<TSchema>["onSubmit"];
  formProps?: Omit<FormProps<input<TSchema>>, "form" | "children">;
};

type Rendered<TValues> = RenderResult & {
  form: FormApi<TValues>;
  user: ReturnType<typeof userEvent.setup>;
};

/** Renders `children` inside `<Form>` of a fresh `useForm`, in ui's provider. */
export const renderForm = <TSchema extends FormSchema>(
  {
    formProps,
    onSubmit = () => undefined,
    ...options
  }: HarnessOptions<TSchema>,
  children: ReactNode | ((form: FormApi<input<TSchema>>) => ReactNode)
): Rendered<input<TSchema>> => {
  const forms: FormApi<input<TSchema>>[] = [];
  const Harness = ({
    onForm,
  }: {
    onForm: (form: FormApi<input<TSchema>>) => void;
  }): ReactElement => {
    const form = useForm({ ...options, onSubmit } as UseFormOptions<TSchema>);
    useEffect(() => onForm(form), [form, onForm]);
    return (
      <WithUi>
        <Form form={form} {...formProps}>
          {typeof children === "function" ? children(form) : children}
        </Form>
      </WithUi>
    );
  };
  const onForm = (form: FormApi<input<TSchema>>): void => {
    forms.push(form);
  };
  const view = render(<Harness onForm={onForm} />);
  const form = forms[0];
  if (form === undefined)
    throw new Error("renderForm: the form never rendered");
  return { ...view, form, user: userEvent.setup() };
};

/**
 * For a test that expects a render to throw: React logs the error and React 18 reports it again
 * through a window error event, which jsdom prints.
 */
export const silenceRenderErrors = (): void => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  const prevent = (event: ErrorEvent): void => event.preventDefault();
  window.addEventListener("error", prevent);
  onTestFinished(() => window.removeEventListener("error", prevent));
};
