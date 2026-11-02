import type { Token } from "./prices";

/** Liquidity provider fee, taken from the input. */
export const LP_FEE = 0.003;
/**
 * Simulated liquidity on each side of every pool, in USD. Deliberately
 * shallow so the demo wallet can reach every price-impact warning level.
 */
export const POOL_DEPTH_USD = 100_000;
/** Simulated network fee, in USD. */
export const NETWORK_FEE_USD = 0.38;

/** Slippage: 0.005 means 0.5%. */
export const DEFAULT_SLIPPAGE = 0.005;
export const SLIPPAGE_PRESETS = [0.001, 0.005, 0.01] as const;

/** Price impact warning levels, same as the Uniswap interface (0.01 = 1%). */
export const IMPACT = { medium: 0.01, high: 0.03, severe: 0.05, blocked: 0.15 } as const;
export type ImpactLevel = "low" | "medium" | "high" | "severe" | "blocked";

export interface Quote {
  from: Token;
  to: Token;
  amountIn: number;
  amountOut: number;
  amountInUsd: number;
  amountOutUsd: number;
  feeUsd: number;
  /** Fraction lost to pool depth, excluding the fee. 0.016 = 1.6%. */
  priceImpact: number;
  /** Output per one unit of input at the market price, before fee and impact. */
  marketRate: number;
  slippage: number;
  /** The least the user accepts after slippage ("Minimum received"). */
  minReceived: number;
}

export function impactLevel(impact: number): ImpactLevel {
  if (impact >= IMPACT.blocked) return "blocked";
  if (impact >= IMPACT.severe) return "severe";
  if (impact >= IMPACT.high) return "high";
  if (impact >= IMPACT.medium) return "medium";
  return "low";
}

/**
 * "I pay this much; how much do I get?"
 *
 * Simulated pool (x·y = k), in USD:
 *   1. Take the fee off what goes in.
 *   2. out = in · D / (D + in), where D is the pool depth.
 *      The bigger the trade compared with the pool, the worse the price.
 *   3. Price impact = in / (D + in): how much worse than the market price.
 *
 * Example: $1,646 in, $100k pool -> $1,641 after fee -> $1,614.5 out, 1.6% impact.
 */
export function getQuote(
  amountIn: number,
  from: Token,
  to: Token,
  slippage: number,
): Quote | null {
  if (amountIn <= 0) return null;
  const amountInUsd = amountIn * from.priceUsd;
  const inAfterFeeUsd = amountInUsd * (1 - LP_FEE);
  const amountOutUsd =
    (inAfterFeeUsd * POOL_DEPTH_USD) / (POOL_DEPTH_USD + inAfterFeeUsd);
  const amountOut = amountOutUsd / to.priceUsd;
  return {
    from,
    to,
    amountIn,
    amountOut,
    amountInUsd,
    amountOutUsd,
    feeUsd: amountInUsd * LP_FEE,
    priceImpact: inAfterFeeUsd / (POOL_DEPTH_USD + inAfterFeeUsd),
    marketRate: from.priceUsd / to.priceUsd,
    slippage,
    minReceived: amountOut * (1 - slippage),
  };
}
