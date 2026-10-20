import Decimal from 'decimal.js'

type Numeric = Decimal.Value | null | undefined

/** Formats a money amount, e.g. "Rs 12,500" for PKR. Never rounds before display. */
export function formatMoney(value: Numeric, currency = 'PKR', locale = 'en-PK'): string {
  const amount = new Decimal(value ?? 0)
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: amount.isInteger() ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount.toNumber())
}

/** Formats a quantity with its unit code, trimming trailing zeros, e.g. "12.5 L". */
export function formatQty(value: Numeric, unit?: string, locale = 'en-PK'): string {
  const qty = new Decimal(value ?? 0)
  const text = new Intl.NumberFormat(locale, { maximumFractionDigits: 3 }).format(qty.toNumber())
  return unit ? `${text} ${unit}` : text
}

/** Converts a quantity using a "1 from = factor to" conversion, without intermediate rounding. */
export function convertQty(qty: Decimal.Value, factor: Decimal.Value): Decimal {
  return new Decimal(qty).times(factor)
}
