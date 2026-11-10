import { THEME_ATTRIBUTE } from "@handijit/design";
import "@handijit/design/tokens.css";
import "@handijit/design/fonts.css";
import { UiProvider } from "@handijit/ui";
import "@handijit/ui/base.css";
import "@handijit/ui/styles.css";
import { isValidPhone, isValidTckn } from "@handijit/tr";
import { StrictMode, useState, type ReactElement } from "react";
import { createRoot } from "react-dom/client";
import { z } from "zod";

import { Form, useForm, useUnsavedChanges } from "@handijit/forms";
import { phoneFormat, tcknFormat } from "@handijit/forms/tr";
import {
  CheckboxField,
  ErrorSummary,
  NumberField,
  PasswordField,
  RadioGroupField,
  SelectField,
  SubmitButton,
  SwitchField,
  TextareaField,
  TextField,
} from "@handijit/forms/ui";

import "./sample.css";

const params = new URLSearchParams(window.location.search);
document.documentElement.setAttribute(
  THEME_ATTRIBUTE,
  params.get("theme") === "dark" ? "dark" : "light"
);

const schema = z
  .object({
    name: z.string().min(2, "Adınızı yazın"),
    email: z.email("Geçerli bir e-posta adresi yazın"),
    phone: z
      .string()
      .refine(isValidPhone, "Geçerli bir telefon numarası yazın"),
    tckn: z
      .string()
      .refine(isValidTckn, "Geçerli bir T.C. kimlik numarası yazın"),
    seats: z.number({ error: "Kişi sayısını yazın" }).min(1, "En az 1 kişi"),
    city: z.enum(["ist", "ank", "izm"], { error: "Şehir seçin" }),
    plan: z.enum(["monthly", "yearly"], { error: "Bir plan seçin" }),
    password: z.string().min(8, "En az 8 karakter"),
    confirm: z.string(),
    note: z.string().max(200, "En fazla 200 karakter"),
    newsletter: z.boolean(),
    terms: z.literal(true, { error: "Devam etmek için koşulları kabul edin" }),
  })
  .refine((value) => value.password === value.confirm, {
    path: ["confirm"],
    message: "Şifreler eşleşmiyor",
  });

const LABELS = {
  required: "(zorunlu)",
  selectPlaceholder: "Seçin",
  passwordShow: "Şifreyi göster",
  passwordHide: "Şifreyi gizle",
  close: "Kapat",
};

const wait = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const Sample = (): ReactElement => {
  const [saved, setSaved] = useState<string | null>(null);
  const form = useForm({
    schema,
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      tckn: "",
      password: "",
      confirm: "",
      note: "",
      newsletter: false,
    },
    onSubmit: async (values, { applyServerErrors }) => {
      await wait(400);
      // The sample server rejects one address, the way the backend answers (RFC 9457).
      if (values.email === "kayitli@handijit.com") {
        applyServerErrors({
          status: 400,
          code: "VALIDATION_ERROR",
          detail: "Bu e-posta adresiyle bir hesap var.",
          fields: ["email"],
        });
        return;
      }
      setSaved(values.name);
    },
  });
  const hasUnsavedChanges = useUnsavedChanges(form);
  return (
    <main className="sample">
      <h1>Hesap oluştur</h1>
      <p data-testid="status">
        {saved === null
          ? hasUnsavedChanges
            ? "Kaydedilmemiş değişiklikler var"
            : "Değişiklik yok"
          : `Kaydedildi: ${saved}`}
      </p>
      <Form form={form} aria-label="Hesap oluştur">
        <ErrorSummary />
        <TextField name="name" label="Ad soyad" autoComplete="name" />
        <TextField
          name="email"
          label="E-posta"
          type="email"
          autoComplete="email"
          hint="Fatura bu adrese gelir"
        />
        <div className="sample__row">
          <TextField
            name="phone"
            label="Telefon"
            format={phoneFormat}
            inputMode="tel"
            autoComplete="tel"
          />
          <TextField
            name="tckn"
            label="T.C. kimlik no"
            format={tcknFormat}
            inputMode="numeric"
          />
        </div>
        <div className="sample__row">
          <NumberField name="seats" label="Kişi sayısı" />
          <SelectField
            name="city"
            label="Şehir"
            options={[
              { value: "ist", label: "İstanbul" },
              { value: "ank", label: "Ankara" },
              { value: "izm", label: "İzmir" },
            ]}
          />
        </div>
        <RadioGroupField
          name="plan"
          label="Plan"
          options={[
            { value: "monthly", label: "Aylık" },
            { value: "yearly", label: "Yıllık", hint: "İki ay bizden" },
          ]}
        />
        <div className="sample__row">
          <PasswordField
            name="password"
            label="Şifre"
            autoComplete="new-password"
          />
          <PasswordField
            name="confirm"
            label="Şifre (tekrar)"
            autoComplete="new-password"
          />
        </div>
        <TextareaField name="note" label="Not" hint="İsteğe bağlı" rows={3} />
        <SwitchField name="newsletter" label="Haftalık bülteni al" />
        <CheckboxField
          name="terms"
          label="Kullanım koşullarını kabul ediyorum"
        />
        <SubmitButton>Hesap oluştur</SubmitButton>
      </Form>
    </main>
  );
};

createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <UiProvider labels={LABELS}>
      <Sample />
    </UiProvider>
  </StrictMode>
);
