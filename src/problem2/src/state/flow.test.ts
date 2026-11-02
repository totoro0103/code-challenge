import { describe, expect, it } from "vitest";
import snapshot from "../data/prices.snapshot.json";
import { normalizePrices, type PriceEntry } from "../lib/prices";
import { getQuote } from "../lib/quote";
import { flowReducer, initialFlow, type Flow } from "./flow";

const tokens = normalizePrices(snapshot as PriceEntry[]);
const quote = getQuote(1, tokens.find((t) => t.symbol === "ETH")!, tokens[0], 0.005)!;
const receipt = {
  id: "X",
  from: "ETH",
  to: "A",
  amountIn: 1,
  amountOut: 1,
  amountOutUsd: 1,
  time: 0,
};

describe("flowReducer", () => {
  it("walks the happy path", () => {
    let s: Flow = initialFlow;
    s = flowReducer(s, { type: "review", quote });
    expect(s.status).toBe("review");
    s = flowReducer(s, { type: "confirm" });
    expect(s).toMatchObject({ status: "pending", step: "submitting" });
    s = flowReducer(s, { type: "step", step: "confirming" });
    s = flowReducer(s, { type: "succeed", receipt });
    expect(s.status).toBe("success");
    expect(flowReducer(s, { type: "close" })).toEqual(initialFlow);
  });

  it("cannot be closed while pending", () => {
    const pending: Flow = { status: "pending", quote, step: "confirming" };
    expect(flowReducer(pending, { type: "close" })).toBe(pending);
  });

  it("ignores actions that make no sense in the current state", () => {
    expect(flowReducer(initialFlow, { type: "confirm" })).toBe(initialFlow);
    expect(flowReducer(initialFlow, { type: "succeed", receipt })).toBe(initialFlow);
  });

  it("retries from an error back to review", () => {
    const failed: Flow = { status: "error", quote, message: "x" };
    expect(flowReducer(failed, { type: "retry" })).toMatchObject({ status: "review" });
  });
});
