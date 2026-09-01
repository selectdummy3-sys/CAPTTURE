import {
  EXCHANGE_RATES_FROM_ZAR,
  CURRENCIES,
  getSelectedCountry,
  getSelectedCurrency,
  useCountryStore,
} from "@/store/useCountryStore";

// ─────────────────────────────────────────────────────────────────────────────
// CAPTTURE pricing architecture
//
// The seller ONLY ever sets `seller_base_price_zar`. Base prices are stored in
// ZAR and are NEVER overwritten or stored per-country.
//
// For the customer we apply:
//     seller_base_price_zar
//        × exchange_rate          (full precision — NOT rounded)
//        = raw_converted_price    (full precision — NOT rounded)
//        → customer_display_price (rounded whole-number retail price)
//
// The final, authoritative price passed to the customer/order/payment is the
// ROUNDED `customer_display_price`. The rounding difference is intentionally
// retained here and must be accounted for consistently across product cards,
// cart, checkout, order success, and payment return.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Whole-number retail rounding for supported currencies.
 * Only applied to currency conversions — ZAR (rate = 1) is shown exactly as
 * the seller set it. Returns an integer (e.g. 19 for $19.00).
 */
export function roundToRetail(value: number, isForeign: boolean): number {
  if (!Number.isFinite(value)) return 0;
  if (!isForeign) return value;
  return Math.max(0, Math.round(value));
}

/** Whether the given currency code is a foreign (non-ZAR) conversion. */
export function isForeignCurrency(code: string): boolean {
  return code !== "ZAR";
}

export interface PriceBreakdown {
  /** Base ZAR price the seller set (stored value). */
  seller_base_price_zar: number;
  /** Full-precision exchange rate for the selected currency (never rounded). */
  exchange_rate: number;
  /** unrounded ZAR → currency conversion. */
  raw_converted_price: number;
  /** rounded whole-number customer-facing price. */
  customer_display_price: number;
  /** ISO currency code selected by the customer. */
  selected_currency: string;
  /** ISO timestamp of the exchange rate snapshot in use. */
  exchange_rate_timestamp: string | null;
}

/** Current full-precision exchange rate for the selected currency (never rounded). */
export function currentRate(): number {
  const { code } = getSelectedCurrency();
  return EXCHANGE_RATES_FROM_ZAR[code] ?? EXCHANGE_RATES_FROM_ZAR.ZAR;
}

/**
 * ZAR base → display currency (full precision, unrounded).
 * Equivalent to `seller_base_price_zar × exchange_rate`.
 */
export function rawConvertedPrice(zarBase: number | string | null | undefined): number {
  return (Number(zarBase ?? 0) || 0) * currentRate();
}

/**
 * Compute the full price breakdown for a ZAR base amount in the customer's
 * currently selected currency. This is the single source of truth for every
 * price shown to a customer.
 */
export function getPriceBreakdown(
  zarBase: number | string | null | undefined
): PriceBreakdown {
  const seller_base_price_zar = Number(zarBase ?? 0);
  const { code } = getSelectedCurrency();
  const foreign = isForeignCurrency(code);
  const rate =
    EXCHANGE_RATES_FROM_ZAR[code] ?? EXCHANGE_RATES_FROM_ZAR.ZAR;
  const raw_converted_price = seller_base_price_zar * rate;
  const customer_display_price = roundToRetail(raw_converted_price, foreign);
  const timestamp = useCountryStore.getState().exchangeRateTimestamp;
  return {
    seller_base_price_zar: Number.isNaN(seller_base_price_zar)
      ? 0
      : seller_base_price_zar,
    exchange_rate: rate,
    raw_converted_price,
    customer_display_price,
    selected_currency: code,
    exchange_rate_timestamp: timestamp,
  };
}

/**
 * The authoritative price shown to a customer (rounded whole-number retail).
 * Use this for all customer-facing pricing and for order/payment calculations.
 */
export function getCustomerDisplayPrice(zarBase: number | string | null | undefined): number {
  return getPriceBreakdown(zarBase).customer_display_price;
}

/** Format a ZAR base price as a whole-number customer price, e.g. R300 → "$19.00". */
export function formatCustomerPrice(zarBase: number | string | null | undefined): string {
  const breakdown = getPriceBreakdown(zarBase);
  const { code, locale } = getSelectedCurrency();
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: code,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(breakdown.customer_display_price);
}

/**
 * A short currency descriptor for the selected currency, e.g. "USD ($)".
 * Uses the human-friendly symbol from the country mapping.
 */
export function selectedCurrencyLabel(): string {
  const country = getSelectedCountry();
  const { code } = getSelectedCurrency();
  const symbol = CURRENCIES[code]?.symbol ?? country.currencySymbol;
  return `${code} (${symbol})`;
}

/**
 * Customer price for a line (unit ZAR price × quantity).
 * The unit is rounded to the whole-number retail price first, then multiplied
 * by the quantity — so "2 × $19.00 = $38.00" matches what the product page
 * shows and every displayed figure stays additive across cart, checkout and
 * order success.
 */
export function getLineCustomerPrice(
  zarUnitPrice: number | string | null | undefined,
  quantity: number
): number {
  const { code } = getSelectedCurrency();
  const unit = roundToRetail(Number(zarUnitPrice ?? 0) * currentRate(), isForeignCurrency(code));
  return unit * Math.max(1, quantity);
}

/**
 * Total customer price across a set of lines (ZAR unit price + quantity each),
 * using the same rounded-unit rule so displayed totals always add up exactly
 * to the sum of the displayed line prices.
 */
export function getCartCustomerPrice(
  lines: Array<{ price: number; quantity: number }>
): number {
  return lines.reduce((acc, l) => acc + getLineCustomerPrice(l.price, l.quantity), 0);
}

/** Format a line total (ZAR unit × qty) as a whole-number customer price. */
export function formatLineCustomerPrice(
  zarUnitPrice: number | string | null | undefined,
  quantity: number
): string {
  const { code, locale } = getSelectedCurrency();
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: code,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(getLineCustomerPrice(zarUnitPrice, quantity));
}

/**
 * Round a ZAR amount into the selected display currency's whole-number price.
 * Used for fees/coupons/totals that live in ZAR (e.g. shipping, discounts)
 * so they can be summed with rounded line prices without rounding drift.
 */
export function toDisplayNumber(zarAmount: number): number {
  return roundToRetail(Number(zarAmount ?? 0) * currentRate(), isForeignCurrency(getSelectedCurrency().code));
}

/** Format an already-display-space number as the selected currency (no conversion). */
export function formatDisplayNumber(value: number): string {
  const { code, locale } = getSelectedCurrency();
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: code,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
