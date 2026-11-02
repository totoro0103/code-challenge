import { useState } from "react";
import type { Token } from "../lib/prices";
import { useSwap, type Side } from "../state/useSwap";
import { AmountField } from "./AmountField";
import { QuoteDetails } from "./QuoteDetails";
import { TokenPicker } from "./TokenPicker";
import { SettingsSheet } from "./SettingsSheet";
import { ReviewSheet } from "./ReviewSheet";
import { ArrowsVertical, Settings } from "./icons";

/** The swap screen: the form and its sheets. */
export function SwapCard({ tokens }: { tokens: Token[] }) {
  const swap = useSwap(tokens);
  const { actions, quote, flow } = swap;
  const [picker, setPicker] = useState<Side | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  // Each flip turns the arrow another 180°, so it always spins the same way.
  const [flipTurns, setFlipTurns] = useState(0);

  return (
    <>
      <section className="card" aria-labelledby="swap-title">
        <div className="card__head">
          <h1 id="swap-title">Swap</h1>
          <div className="card__tools">
            <button
              type="button"
              className="icon-button"
              onClick={() => setSettingsOpen(true)}
              aria-label="Settings"
            >
              <Settings />
            </button>
          </div>
        </div>

        <form
          className="swap-form"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            actions.review();
          }}
        >
          <AmountField
            id="pay-amount"
            label="You pay"
            token={swap.payToken}
            value={swap.payValue}
            balance={swap.payBalance}
            error={swap.payError}
            onChange={actions.setPayAmount}
            onPickToken={() => setPicker("pay")}
            onFraction={actions.setPayFraction}
          />

          <div className="flip-row">
            <button
              type="button"
              className="flip"
              onClick={() => {
                actions.flip();
                setFlipTurns((n) => n + 1);
              }}
              aria-label="Switch the tokens you pay and receive"
            >
              <span style={{ transform: `rotate(${flipTurns * 180}deg)` }}>
                <ArrowsVertical />
              </span>
            </button>
          </div>

          <AmountField
            id="receive-amount"
            label="You receive"
            token={swap.receiveToken}
            value={swap.receiveValue}
            balance={swap.balances[swap.receiveToken.symbol] ?? 0}
            impact={quote ? { value: quote.priceImpact, level: swap.level } : undefined}
            onPickToken={() => setPicker("receive")}
          />

          {quote && (
            <QuoteDetails
              quote={quote}
              level={swap.level}
              onEditSlippage={() => setSettingsOpen(true)}
            />
          )}

          <button
            type="submit"
            className={`cta cta--${swap.cta.tone}`}
            disabled={swap.cta.disabled}
          >
            {swap.cta.label}
          </button>
        </form>
      </section>

      {picker && (
        <TokenPicker
          title={picker === "pay" ? "You pay with" : "You receive"}
          tokens={swap.tokens}
          balances={swap.balances}
          selected={picker === "pay" ? swap.payToken.symbol : swap.receiveToken.symbol}
          opposite={picker === "pay" ? swap.receiveToken.symbol : swap.payToken.symbol}
          onSelect={(symbol) => {
            actions.selectToken(picker, symbol);
            setPicker(null);
          }}
          onClose={() => setPicker(null)}
        />
      )}

      {settingsOpen && (
        <SettingsSheet
          slippage={swap.slippage}
          failNext={swap.failNext}
          onSlippage={actions.setSlippage}
          onFailNext={actions.setFailNext}
          onClose={() => setSettingsOpen(false)}
        />
      )}

      {flow.status !== "editing" && (
        <ReviewSheet
          flow={flow}
          onAcknowledge={actions.acknowledge}
          onConfirm={actions.confirm}
          onRetry={actions.retry}
          onAdjustSlippage={() => {
            actions.close();
            setSettingsOpen(true);
          }}
          onClose={actions.close}
        />
      )}
    </>
  );
}
