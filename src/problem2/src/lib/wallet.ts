import type { Quote } from "./quote";

/**
 * Mock wallet. The brief has no wallet, but balances make the form realistic:
 * percentage shortcuts, an insufficient-balance check, and balances that
 * update after a swap. They reset when the page reloads.
 */
export const INITIAL_BALANCES: Record<string, number> = {
  ETH: 2.5,
  USDC: 25000,
  SWTH: 250000,
  ATOM: 120,
  OSMO: 800,
  WBTC: 0.05,
};

export type SwapStep = "submitting" | "confirming";

export interface Receipt {
  id: string;
  from: string;
  to: string;
  amountIn: number;
  amountOut: number;
  amountOutUsd: number;
}

/** Why a swap failed, so the UI can offer the right next step. */
export type FailReason = "balance" | "slippage";

export class SwapError extends Error {
  constructor(
    message: string,
    readonly reason: FailReason,
  ) {
    super(message);
  }
}

const slippageError = () =>
  new SwapError(
    "The price moved past your slippage limit, so the swap was cancelled. No funds were spent.",
    "slippage",
  );
const balanceError = (symbol: string) =>
  new SwapError(`Your ${symbol} balance is too low for this swap.`, "balance");

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface ExecuteOptions {
  balances: Record<string, number>;
  onStep?: (step: SwapStep) => void;
  /** Demo switch to show the failure path on demand. */
  forceFailure?: boolean;
  delays?: { submit: number; confirm: number };
}

/**
 * Simulated backend: two steps with a delay, a balance check (never trust
 * the client), then a receipt at the quoted amounts. The demo switch makes
 * it fail the way a real swap does when the price moves past the slippage
 * limit.
 */
export async function executeSwap(
  quote: Quote,
  {
    balances,
    onStep,
    forceFailure,
    delays = { submit: 700, confirm: 1500 },
  }: ExecuteOptions,
): Promise<Receipt> {
  // Step 1: submit, and check the balance like a server would.
  onStep?.("submitting");
  await wait(delays.submit);
  const available = balances[quote.from.symbol] ?? 0;
  if (quote.amountIn > available) throw balanceError(quote.from.symbol);

  // Step 2: wait for the trade to be confirmed.
  onStep?.("confirming");
  await wait(delays.confirm);
  if (forceFailure) throw slippageError();

  return {
    id: Math.random().toString(16).slice(2, 10).toUpperCase(),
    from: quote.from.symbol,
    to: quote.to.symbol,
    amountIn: quote.amountIn,
    amountOut: quote.amountOut,
    amountOutUsd: quote.amountOutUsd,
  };
}
