import { useState } from "react";
import { INITIAL_BALANCES, type Receipt } from "../lib/wallet";

/** The demo wallet's balances, updated by each finished swap. */
export function useWallet() {
  const [balances, setBalances] = useState(INITIAL_BALANCES);

  /** Applies a finished swap: spend one token, receive the other. */
  const record = (receipt: Receipt) => {
    setBalances((b) => ({
      ...b,
      // Math.max guards against tiny negative values from float rounding.
      [receipt.from]: Math.max(0, (b[receipt.from] ?? 0) - receipt.amountIn),
      [receipt.to]: (b[receipt.to] ?? 0) + receipt.amountOut,
    }));
  };

  return { balances, record };
}
