import { useReducer, useState } from "react";
import type { Token } from "../lib/prices";
import { parseAmount, sanitizeAmount, toInputString } from "../lib/amount";
import { DEFAULT_SLIPPAGE, getQuote, impactLevel } from "../lib/quote";
import { checkSwap } from "../lib/validate";
import { executeSwap, SwapError } from "../lib/wallet";
import { useWallet } from "../hooks/useWallet";
import { flowReducer, initialFlow } from "./flow";

export type Side = "pay" | "receive";

/** ETH -> USDC when available, otherwise the first two tokens. */
function defaultPair(tokens: Token[]): [Token, Token] {
  const find = (symbol: string) => tokens.find((t) => t.symbol === symbol);
  const pay = find("ETH") ?? tokens[0];
  const usdc = find("USDC");
  const receive = usdc && usdc !== pay ? usdc : tokens.find((t) => t !== pay)!;
  return [pay, receive];
}

/**
 * The swap screen's state and actions. Components only render what this
 * returns. Only two things are stored about the trade (the token pair and
 * the amount the user typed); everything else is derived each render.
 */
export function useSwap(tokens: Token[]) {
  // 1. Settings and the demo wallet
  const wallet = useWallet();
  const [slippage, setSlippage] = useState(DEFAULT_SLIPPAGE);
  const [failNext, setFailNext] = useState(false);

  // 2. What the user chose
  const [pair, setPair] = useState(() => defaultPair(tokens));
  const [payToken, receiveToken] = pair;
  const [payInput, setPayInput] = useState("");

  // 3. Everything derived from it
  const amount = parseAmount(payInput);
  const quote =
    amount === null ? null : getQuote(amount, payToken, receiveToken, slippage);
  const receiveValue = toInputString(quote?.amountOut ?? 0);
  const payBalance = wallet.balances[payToken.symbol] ?? 0;
  const level = quote ? impactLevel(quote.priceImpact) : "low";
  const { cta, payError } = checkSwap(quote, payBalance, payToken.symbol);

  // 4. Review and execution
  const [flow, dispatch] = useReducer(flowReducer, initialFlow);

  const confirm = async () => {
    if (flow.status !== "review") return;
    const reviewed = flow.quote;
    dispatch({ type: "confirm" });
    try {
      const receipt = await executeSwap(reviewed, {
        balances: wallet.balances,
        forceFailure: failNext,
        onStep: (step) => dispatch({ type: "step", step }),
      });
      wallet.record(receipt);
      setPayInput("");
      dispatch({ type: "succeed", receipt });
    } catch (error) {
      dispatch({
        type: "fail",
        message: error instanceof Error ? error.message : "The swap failed. Try again.",
        reason: error instanceof SwapError ? error.reason : undefined,
      });
    } finally {
      setFailNext(false);
    }
  };

  // 5. Form actions
  const setPayAmount = (raw: string) => setPayInput(sanitizeAmount(raw));

  // Only the tokens swap places; the typed amount stays. So flipping twice
  // always returns exactly to where you started.
  const flip = () => setPair([receiveToken, payToken]);

  const selectToken = (side: Side, symbol: string) => {
    const token = tokens.find((t) => t.symbol === symbol)!;
    const other = side === "pay" ? receiveToken : payToken;
    if (token === other)
      flip(); // picking the other side's token swaps the pair
    else setPair(side === "pay" ? [token, other] : [other, token]);
  };

  return {
    tokens,
    payToken,
    receiveToken,
    payValue: payInput,
    receiveValue,
    payBalance,
    payError,
    quote,
    level,
    cta,
    balances: wallet.balances,
    slippage,
    failNext,
    flow,
    actions: {
      setPayAmount,
      setPayFraction: (fraction: number) =>
        setPayAmount(toInputString(payBalance * fraction)),
      flip,
      selectToken,
      review: () => {
        if (!cta.disabled && quote) dispatch({ type: "review", quote });
      },
      acknowledge: (value: boolean) => dispatch({ type: "acknowledge", value }),
      confirm,
      retry: () => dispatch({ type: "retry" }),
      close: () => dispatch({ type: "close" }),
      setSlippage,
      setFailNext,
    },
  };
}
