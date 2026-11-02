import type { ReactNode } from "react";
import { formatAmount, formatPercent, formatUsd } from "../lib/amount";
import { impactLevel, type Quote } from "../lib/quote";
import type { Flow } from "../state/flow";
import { QuoteDetails } from "./QuoteDetails";
import { Sheet } from "./Sheet";
import { TokenIcon } from "./TokenIcon";
import { Alert, ArrowDown, Check, Close } from "./icons";

interface ReviewSheetProps {
  flow: Exclude<Flow, { status: "editing" }>;
  onAcknowledge: (value: boolean) => void;
  onConfirm: () => void;
  onRetry: () => void;
  /** Offered when the swap failed on slippage: the fix is a wider limit. */
  onAdjustSlippage: () => void;
  onClose: () => void;
}

/** What one state of the flow puts in the sheet. */
interface Content {
  title: string;
  body: ReactNode;
  footer?: ReactNode;
}

/**
 * Review, progress and result of a swap. One sheet stays open through the
 * whole flow and only its content changes, so it doesn't re-animate or
 * lose focus between steps.
 */
export function ReviewSheet(props: ReviewSheetProps) {
  const { flow, onClose } = props;
  const content = contentFor(props);

  return (
    <Sheet
      title={content.title}
      onClose={onClose}
      dismissible={flow.status !== "pending"} // can't close mid-swap
      footer={content.footer}
    >
      {content.body}
    </Sheet>
  );
}

function contentFor(props: ReviewSheetProps): Content {
  switch (props.flow.status) {
    case "review":
      return reviewContent(props.flow, props);
    case "pending":
      return pendingContent(props.flow);
    case "success":
      return successContent(props.flow, props);
    case "error":
      return errorContent(props.flow, props);
  }
}

// ---- Review: the frozen quote, waiting for the user to confirm ----------

function reviewContent(
  flow: Extract<Flow, { status: "review" }>,
  { onAcknowledge, onConfirm }: ReviewSheetProps,
): Content {
  const { quote } = flow;
  const level = impactLevel(quote.priceImpact);
  const showWarning = level === "high" || level === "severe"; // 3% or more
  const needsAcknowledgement = level === "severe"; // 5% or more
  const canConfirm = !needsAcknowledgement || flow.acknowledged;

  return {
    title: "Review swap",
    body: (
      <>
        {showWarning && (
          <p className={`banner banner--${level}`}>
            <Alert size={16} /> High price impact. Consider a smaller amount.
          </p>
        )}

        <div className="legs">
          <Leg label="You pay" amount={quote.amountIn} quote={quote} side="from" />
          <span className="legs__arrow">
            <ArrowDown />
          </span>
          <Leg
            // The output can still move a little before the swap lands.
            label="You receive (estimated)"
            amount={quote.amountOut}
            quote={quote}
            side="to"
          />
        </div>

        <QuoteDetails quote={quote} level={level} alwaysOpen />

        {needsAcknowledgement && (
          <label className="ack">
            <input
              type="checkbox"
              checked={flow.acknowledged}
              onChange={(event) => onAcknowledge(event.target.checked)}
            />
            <span>
              I understand this swap has a {formatPercent(quote.priceImpact)} price impact
              and I may receive much less than the market rate.
            </span>
          </label>
        )}
      </>
    ),
    footer: (
      <button
        type="button"
        className={`cta${level === "severe" ? " cta--danger" : ""}`}
        disabled={!canConfirm}
        onClick={onConfirm}
      >
        Confirm swap
      </button>
    ),
  };
}

/** One side of the trade on the review screen. */
function Leg({
  label,
  amount,
  quote,
  side,
}: {
  label: string;
  amount: number;
  quote: Quote;
  side: "from" | "to";
}) {
  const token = quote[side];
  return (
    <div className="leg">
      <div>
        <div className="leg__label">{label}</div>
        <div className="leg__amount">
          {formatAmount(amount)} {token.symbol}
        </div>
        <div className="leg__usd">{formatUsd(amount * token.priceUsd)}</div>
      </div>
      <TokenIcon token={token} size={40} />
    </div>
  );
}

// ---- Pending: two steps with a spinner, no footer ------------------------

const STEPS = [
  { key: "submitting", label: "Submitting your swap" },
  { key: "confirming", label: "Waiting for confirmation" },
] as const;

function pendingContent(flow: Extract<Flow, { status: "pending" }>): Content {
  const { quote } = flow;
  const currentIndex = STEPS.findIndex((step) => step.key === flow.step);

  return {
    title: "Swapping",
    body: (
      <div className="progress">
        <p className="progress__summary">
          {formatAmount(quote.amountIn)} {quote.from.symbol} →{" "}
          {formatAmount(quote.amountOut)} {quote.to.symbol}
        </p>
        <ol className="steps" aria-live="polite">
          {STEPS.map((step, index) => {
            const isDone = index < currentIndex;
            const isCurrent = index === currentIndex;
            return (
              <li
                key={step.key}
                className={isDone ? "is-done" : isCurrent ? "is-current" : ""}
              >
                <span className="steps__dot" aria-hidden="true">
                  {isDone && <Check size={14} />}
                  {isCurrent && <span className="spinner" />}
                </span>
                {step.label}
                {isCurrent && <span className="sr-only"> (in progress)</span>}
              </li>
            );
          })}
        </ol>
        <p className="setting__hint">This usually takes a few seconds.</p>
      </div>
    ),
  };
}

// ---- Success -------------------------------------------------------------

function successContent(
  flow: Extract<Flow, { status: "success" }>,
  { onClose }: ReviewSheetProps,
): Content {
  const { receipt } = flow;
  return {
    title: "Swap complete",
    body: (
      <div className="result">
        <span className="result__icon result__icon--ok" aria-hidden="true">
          <Check size={28} />
        </span>
        <p className="result__headline">
          You received {formatAmount(receipt.amountOut)} {receipt.to}
        </p>
        <p className="result__sub">
          for {formatAmount(receipt.amountIn)} {receipt.from}, worth{" "}
          {formatUsd(receipt.amountOutUsd)}.
        </p>
        <p className="result__meta">Transaction {receipt.id}</p>
      </div>
    ),
    footer: (
      <button type="button" className="cta" onClick={onClose}>
        Done
      </button>
    ),
  };
}

// ---- Error ---------------------------------------------------------------

function errorContent(
  flow: Extract<Flow, { status: "error" }>,
  { onRetry, onAdjustSlippage }: ReviewSheetProps,
): Content {
  const retry = (
    <button type="button" className="cta" onClick={onRetry}>
      Try again
    </button>
  );

  return {
    title: "Swap failed",
    body: (
      <div className="result">
        <span className="result__icon result__icon--error" aria-hidden="true">
          <Close size={28} />
        </span>
        <p className="result__headline">Your swap didn’t go through</p>
        <p className="result__sub" role="alert">
          {flow.message}
        </p>
      </div>
    ),
    // No "Close" button: the X already closes. A second button only appears
    // when it offers a different way forward.
    footer:
      flow.reason === "slippage" ? (
        <div className="foot-row">
          <button
            type="button"
            className="button button--quiet"
            onClick={onAdjustSlippage}
          >
            Adjust slippage
          </button>
          {retry}
        </div>
      ) : (
        retry
      ),
  };
}
