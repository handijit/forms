// The Turkish entry (optional peer: @handijitcom/tr). The lists below ARE its public contract;
// this file holds no logic.
import dateFormat from "./tr/date-format";
import ibanFormat from "./tr/iban-format";
import TR_MESSAGES from "./tr/messages.constants";
import type { TrMessages } from "./tr/messages.constants";
import moneyFormat from "./tr/money-format";
import phoneFormat from "./tr/phone-format";
import tcknFormat from "./tr/tckn-format";
import vknFormat from "./tr/vkn-format";

export {
  dateFormat,
  ibanFormat,
  moneyFormat,
  phoneFormat,
  tcknFormat,
  TR_MESSAGES,
  vknFormat,
};
export type { TrMessages };
