import { render, type RenderResult } from "@testing-library/react";
import { UiProvider } from "@handijit/ui";
import type { ReactElement, ReactNode } from "react";
import { vi } from "vitest";
import type { z } from "zod";

import {
  Form,
  useForm,
  type FormApi,
  type FormMode,
  type FormSchema,
} from "../../lib/index";

/** The texts ui asks its provider for, so that no test logs a missing label. */
export const LABELS = {
  required: "(zorunlu)",
  selectPlaceholder: "Seçin",
  passwordShow: "Şifreyi göster",
  passwordHide: "Şifreyi gizle",
  close: "Kapat",
  locale: "tr-TR",
  combobox: {
    searchPlaceholder: "Ara",
    emptyMessage: "Sonuç yok",
    loadingMessage: "Yükleniyor",
    clearLabel: "Temizle",
  },
  quantity: { label: "Adet", decrease: "Azalt", increase: "Artır" },
  range: { min: "En az", max: "En çok" },
  fileUpload: {
    tooLarge: (name: string, max: string) => `${name} ${max} sınırını aşıyor`,
    uploading: (name: string) => `${name} yükleniyor`,
    added: (count: number) => `${count} dosya eklendi`,
  },
  tagInput: {
    added: (value: string) => `${value} eklendi`,
    removed: (value: string) => `${value} kaldırıldı`,
  },
  rating: {
    srLabel: (value: number) => `${value} yıldız`,
    starCount: (star: number) => `${star} yıldız`,
    scale: { 1: "Çok kötü", 2: "Kötü", 3: "Orta", 4: "İyi", 5: "Çok iyi" },
  },
};

type Options<TSchema extends FormSchema> = {
  schema: TSchema;
  defaultValues: z.input<TSchema>;
  onSubmit?: (values: z.output<TSchema>) => unknown;
  mode?: FormMode;
  isDisabled?: boolean;
  isReadOnly?: boolean;
  children: ReactNode;
};

export type RenderedForm<TSchema extends FormSchema> = RenderResult & {
  form: () => FormApi<z.input<TSchema>>;
  onSubmit: ReturnType<typeof vi.fn>;
};

/** Renders `children` inside a `<Form>` of a fresh form, under ui's provider. */
export const renderForm = <TSchema extends FormSchema>({
  schema,
  defaultValues,
  onSubmit = vi.fn(),
  mode,
  isDisabled,
  isReadOnly,
  children,
}: Options<TSchema>): RenderedForm<TSchema> => {
  let current: FormApi<z.input<TSchema>> | null = null;
  const Host = (): ReactElement => {
    const form = useForm({
      schema,
      defaultValues: defaultValues as never,
      onSubmit,
      ...(mode === undefined ? {} : { mode }),
    });
    current = form as FormApi<z.input<TSchema>>;
    return (
      <UiProvider labels={LABELS}>
        <Form
          form={form}
          aria-label="Form"
          {...(isDisabled === undefined ? {} : { isDisabled })}
          {...(isReadOnly === undefined ? {} : { isReadOnly })}
        >
          {children}
          <button type="submit">Gönder</button>
        </Form>
      </UiProvider>
    );
  };
  const result = render(<Host />);
  return {
    ...result,
    form: () => current as FormApi<z.input<TSchema>>,
    onSubmit: onSubmit as ReturnType<typeof vi.fn>,
  };
};
