import type { FormMessages } from "../types/form.type";

/** The texts a form shows on its own, in Turkish; override them with `useForm({ messages })`. */
const DEFAULT_MESSAGES: Readonly<FormMessages> = /*#__PURE__*/ Object.freeze({
  submitFailed: "Form gönderilemedi. Lütfen tekrar deneyin.",
  serverFieldError: "Bu alanı kontrol edin.",
});

export default DEFAULT_MESSAGES;
