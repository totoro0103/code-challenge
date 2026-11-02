import type { Quote } from "../lib/quote";
import type { FailReason, Receipt, SwapStep } from "../lib/wallet";

/**
 * The swap flow as an explicit state machine. Each status carries only the
 * data that makes sense in it, so impossible combinations (say, "success"
 * with an error message) cannot be represented.
 *
 *   editing --review--> review --confirm--> pending --succeed--> success
 *      ^                  |                    |                   |
 *      +-----cancel-------+                    +--fail--> error ---+--> editing
 */
export type Flow =
  | { status: "editing" }
  | { status: "review"; quote: Quote; acknowledged: boolean }
  | { status: "pending"; quote: Quote; step: SwapStep }
  | { status: "success"; quote: Quote; receipt: Receipt }
  | { status: "error"; quote: Quote; message: string; reason?: FailReason };

export type FlowAction =
  | { type: "review"; quote: Quote }
  | { type: "acknowledge"; value: boolean }
  | { type: "confirm" }
  | { type: "step"; step: SwapStep }
  | { type: "succeed"; receipt: Receipt }
  | { type: "fail"; message: string; reason?: FailReason }
  | { type: "retry" }
  | { type: "close" };

export const initialFlow: Flow = { status: "editing" };

export function flowReducer(state: Flow, action: FlowAction): Flow {
  switch (action.type) {
    case "review":
      return state.status === "editing"
        ? { status: "review", quote: action.quote, acknowledged: false }
        : state;
    case "acknowledge":
      return state.status === "review" ? { ...state, acknowledged: action.value } : state;
    case "confirm":
      return state.status === "review"
        ? { status: "pending", quote: state.quote, step: "submitting" }
        : state;
    case "step":
      return state.status === "pending" ? { ...state, step: action.step } : state;
    case "succeed":
      return state.status === "pending"
        ? { status: "success", quote: state.quote, receipt: action.receipt }
        : state;
    case "fail":
      return state.status === "pending"
        ? {
            status: "error",
            quote: state.quote,
            message: action.message,
            reason: action.reason,
          }
        : state;
    case "retry":
      return state.status === "error"
        ? { status: "review", quote: state.quote, acknowledged: false }
        : state;
    case "close":
      // A pending swap cannot be dismissed: the user must see how it ends.
      return state.status === "pending" ? state : initialFlow;
  }
}
