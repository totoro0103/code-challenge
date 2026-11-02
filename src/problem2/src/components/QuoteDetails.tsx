import { useState } from "react";
import { formatAmount, formatPercent, formatUsd } from "../lib/amount";
import { NETWORK_FEE_USD, LP_FEE, type ImpactLevel, type Quote } from "../lib/quote";
import { ChevronDown } from "./icons";

interface QuoteDetailsProps {
  quote: Quote;
  level: ImpactLevel;
  onEditSlippage?: () => void;
  /** Review screen shows every row without the toggle. */
  alwaysOpen?: boolean;
}

/** Rate summary that expands into the trade details. */
export function QuoteDetails({
  quote,
  level,
  onEditSlippage,
  alwaysOpen,
}: QuoteDetailsProps) {
  const [open, setOpen] = useState(false);
  const [inverted, setInverted] = useState(false);
  const expanded = alwaysOpen || open;

  // "1 ETH = 1,646 USDC", or the other way round after a tap.
  const rate = inverted
    ? { one: quote.to, other: quote.from, value: 1 / quote.marketRate }
    : { one: quote.from, other: quote.to, value: quote.marketRate };

  return (
    <div className={`details${expanded ? " is-open" : ""}`}>
      <div className="details__summary">
        <button
          type="button"
          className="details__rate"
          onClick={() => setInverted((v) => !v)}
          title="Show the rate the other way round"
        >
          1 {rate.one.symbol} = {formatAmount(rate.value)} {rate.other.symbol}
          <span className="details__rate-usd"> ({formatUsd(rate.one.priceUsd)})</span>
        </button>
        {!alwaysOpen && (
          <button
            type="button"
            className="details__toggle"
            aria-expanded={open}
            aria-controls="quote-details"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? "Hide" : `Fee ${formatUsd(quote.feeUsd + NETWORK_FEE_USD)}`}
            <ChevronDown />
          </button>
        )}
      </div>

      {expanded && (
        <dl className="details__list" id="quote-details">
          <div>
            <dt>Price impact</dt>
            <dd className={`impact impact--${level}`}>
              {formatPercent(quote.priceImpact)}
            </dd>
          </div>
          <div>
            <dt>Max slippage</dt>
            <dd>
              {formatPercent(quote.slippage)}
              {onEditSlippage && (
                <button type="button" className="link-button" onClick={onEditSlippage}>
                  Edit
                </button>
              )}
            </dd>
          </div>
          <div>
            <dt>Minimum received</dt>
            <dd>
              {formatAmount(quote.minReceived)} {quote.to.symbol}
            </dd>
          </div>
          <div>
            <dt>Liquidity fee ({formatPercent(LP_FEE)})</dt>
            <dd>{formatUsd(quote.feeUsd)}</dd>
          </div>
          <div>
            <dt>Network fee</dt>
            <dd>{formatUsd(NETWORK_FEE_USD)}</dd>
          </div>
          <div>
            <dt>Route</dt>
            <dd>
              {quote.from.symbol} → {quote.to.symbol}
            </dd>
          </div>
        </dl>
      )}
    </div>
  );
}
