import { toInputString } from "./amount";
import { impactLevel, type Quote } from "./quote";

export type CtaTone = "primary" | "warning" | "danger";

export interface SwapCheck {
  /** What the main button says, whether it works, and its colour. */
  cta: { label: string; disabled: boolean; tone: CtaTone };
  /** Shown under the pay field, when the fix is to change that amount. */
  payError?: string;
}

/**
 * Decides whether the swap can go ahead and, if not, explains why.
 * Checks run from the most basic to the most specific, and the first
 * problem found wins, so the user always sees one clear message.
 * `quote` is null until the user enters an amount above zero.
 */
export function checkSwap(
  quote: Quote | null,
  balance: number,
  symbol: string,
): SwapCheck {
  if (!quote) {
    return { cta: { label: "Enter an amount", disabled: true, tone: "primary" } };
  }
  if (quote.amountIn > balance) {
    return {
      cta: { label: `Insufficient ${symbol} balance`, disabled: true, tone: "primary" },
      payError:
        balance > 0
          ? `You have ${toInputString(balance)} ${symbol}. Lower the amount or use Max.`
          : `You don’t hold any ${symbol}. Choose a token you hold.`,
    };
  }

  const level = impactLevel(quote.priceImpact);
  if (level === "blocked") {
    return { cta: { label: "Price impact too high", disabled: true, tone: "danger" } };
  }
  const tone: CtaTone =
    level === "severe" ? "danger" : level === "high" ? "warning" : "primary";
  return { cta: { label: "Review swap", disabled: false, tone } };
}
