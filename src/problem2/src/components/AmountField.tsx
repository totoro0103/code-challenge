import type { Token } from "../lib/prices";
import { formatAmount, formatPercent, formatUsd, parseAmount } from "../lib/amount";
import type { ImpactLevel } from "../lib/quote";
import { TokenIcon } from "./TokenIcon";
import { ChevronDown } from "./icons";

interface AmountFieldProps {
  id: string;
  label: string;
  token: Token;
  value: string;
  balance: number;
  /** Shown next to the USD value on the receive side. */
  impact?: { value: number; level: ImpactLevel };
  error?: string;
  /** Without it the field is read-only: the receive side shows the quote. */
  onChange?: (raw: string) => void;
  onPickToken: () => void;
  /** Pay side only: quick amounts. */
  onFraction?: (fraction: number) => void;
}

/** One side of the swap: label, amount, token button, USD value and balance. */
export function AmountField({
  id,
  label,
  token,
  value,
  balance,
  impact,
  error,
  onChange,
  onPickToken,
  onFraction,
}: AmountFieldProps) {
  const amount = parseAmount(value) ?? 0;
  // Long numbers get a smaller font so they fit next to the token button.
  const sizeClass = value.length > 14 ? " is-xlong" : value.length > 9 ? " is-long" : "";
  // Only worth showing once it passes 1% ("medium" or worse).
  const showImpact = impact && amount > 0 && impact.level !== "low";

  return (
    <div className={`field${error ? " has-error" : ""}${onChange ? "" : " is-readonly"}`}>
      <div className="field__top">
        <label className="field__label" htmlFor={id}>
          {label}
        </label>
        {onFraction && balance > 0 && (
          <span className="field__chips">
            <button type="button" className="chip" onClick={() => onFraction(0.5)}>
              50%
            </button>
            <button type="button" className="chip" onClick={() => onFraction(1)}>
              Max
            </button>
          </span>
        )}
      </div>

      <div className="field__row">
        <input
          id={id}
          className={`field__input${sizeClass}`}
          inputMode="decimal"
          autoComplete="off"
          spellCheck={false}
          placeholder="0"
          value={value}
          readOnly={!onChange}
          onChange={(event) => onChange?.(event.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        {/* type="button": inside a form, a plain <button> would submit it. */}
        <button
          type="button"
          className="token-button"
          onClick={onPickToken}
          aria-label={`${label}: ${token.symbol}. Change token`}
        >
          <TokenIcon token={token} size={28} />
          <span>{token.symbol}</span>
          <ChevronDown />
        </button>
      </div>

      <div className="field__bottom">
        <span>
          {/* A non-breaking space keeps the row's height when there's no value. */}
          {amount > 0 ? formatUsd(amount * token.priceUsd) : "\u00a0"}
          {showImpact && (
            <span className={`impact impact--${impact.level}`}>
              {" "}
              (−{formatPercent(impact.value)})
            </span>
          )}
        </span>
        <span className="field__balance">Balance {formatAmount(balance)}</span>
      </div>

      {error && (
        <p className="field__error" id={`${id}-error`} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
