/** The error texts for the Turkish formats' values, for the schema's refinements. */
export type TrMessages = {
  tckn: string;
  vkn: string;
  iban: string;
  /** Any Turkish number: landline, mobile or 850. */
  phone: string;
  mobilePhone: string;
  date: string;
  money: string;
};

/**
 * Turkish error texts to pass to the schema next to `@handijitcom/tr`'s checks:
 * `z.string().refine(isTckn, TR_MESSAGES.tckn)`.
 */
const TR_MESSAGES: Readonly<TrMessages> = /*#__PURE__*/ Object.freeze({
  tckn: "Geçerli bir T.C. kimlik numarası yazın.",
  vkn: "Geçerli bir vergi kimlik numarası yazın.",
  iban: "Geçerli bir IBAN yazın.",
  phone: "Geçerli bir telefon numarası yazın.",
  mobilePhone: "Geçerli bir cep telefonu numarası yazın.",
  date: "Geçerli bir tarih yazın (gg.aa.yyyy).",
  money: "Geçerli bir tutar yazın.",
});

export default TR_MESSAGES;
