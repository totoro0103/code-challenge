/** Max decimals a user can type. Enough for every token in the feed. */
export const MAX_DECIMALS = 8;

/**
 * Cleans raw keyboard or paste input into a valid, possibly partial, decimal.
 * Accepts "," as the decimal separator, drops anything that is not a digit,
 * keeps a single dot, trims extra decimals and redundant leading zeros.
 * Partial input such as "" or "0." stays as typed so typing feels natural.
 */
export function sanitizeAmount(raw: string, maxDecimals = MAX_DECIMALS): string {
  // 1. Comma becomes a dot, then remove everything except digits and dots.
  //    "1,5" -> "1.5", "abc12" -> "12", "-3" -> "3"
  let value = raw.replace(/,/g, ".").replace(/[^\d.]/g, "");

  // 2. Keep only the first dot, and at most `maxDecimals` digits after it.
  //    "1.2.3" -> "1.23", ".5" -> "0.5"
  const firstDot = value.indexOf(".");
  if (firstDot !== -1) {
    const whole = value.slice(0, firstDot) || "0";
    const fraction = value
      .slice(firstDot + 1)
      .replace(/\./g, "")
      .slice(0, maxDecimals);
    value = `${whole}.${fraction}`;
  }

  // 3. Drop leading zeros that are followed by another digit.
  //    "007" -> "7", "00.5" -> "0.5", but "0.5" stays
  return value.replace(/^0+(?=\d)/, "");
}

/** Parses a sanitized amount; returns null for empty or partial input. */
export function parseAmount(value: string): number | null {
  if (value === "" || value === ".") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

const SIGNIFICANT_DIGITS = 6;

/**
 * How many decimals to show so a number keeps about 6 significant digits,
 * never fewer than 2 and never more than 12:
 *   1646.134136  -> 2 decimals  -> 1646.13
 *   1.523419     -> 5 decimals  -> 1.52342
 *   0.000607484  -> 9 decimals  -> 0.000607484
 */
function decimalsFor(n: number): number {
  // Digits before the decimal point: 4 for 1646, 1 for 1.5, -3 for 0.0006.
  const integerDigits = Math.floor(Math.log10(n)) + 1;
  const decimals = SIGNIFICANT_DIGITS - integerDigits;
  return Math.min(12, Math.max(2, decimals));
}

/** Formats a computed amount for an input: plain digits, no grouping. */
export function toInputString(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "";
  // Drop trailing zeros: "1.500000" -> "1.5", "2.000000" -> "2"
  return n.toFixed(decimalsFor(n)).replace(/\.?0+$/, "");
}

/** Human-readable token amount with grouping, e.g. 12,345.678901 */
export function formatAmount(n: number): string {
  if (!Number.isFinite(n) || n === 0) return "0";
  return n.toLocaleString("en-US", { maximumFractionDigits: decimalsFor(Math.abs(n)) });
}

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

export function formatUsd(n: number): string {
  if (n > 0 && n < 0.01) return "< $0.01";
  return usd.format(n);
}

/** 0.0123 -> "1.23%", tiny values -> "< 0.01%" */
export function formatPercent(fraction: number): string {
  const pct = fraction * 100;
  if (pct > 0 && pct < 0.01) return "< 0.01%";
  return `${pct.toLocaleString("en-US", { maximumFractionDigits: 2 })}%`;
}
