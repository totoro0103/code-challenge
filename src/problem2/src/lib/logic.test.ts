import { describe, expect, it } from "vitest";
import snapshot from "../data/prices.snapshot.json";
import { normalizePrices, type PriceEntry } from "./prices";
import { formatPercent, parseAmount, sanitizeAmount, toInputString } from "./amount";
import { getQuote, impactLevel, LP_FEE } from "./quote";
import { checkSwap } from "./validate";
import { executeSwap } from "./wallet";

const tokens = normalizePrices(snapshot as PriceEntry[]);
const token = (s: string) => tokens.find((t) => t.symbol === s)!;
const ETH = token("ETH");
const USDC = token("USDC");

describe("normalizePrices", () => {
  it("keeps one token per currency", () => {
    expect(snapshot.length).toBe(36);
    expect(tokens.length).toBe(32);
  });

  it("resolves duplicates: newest date, then the later row", () => {
    expect(USDC.priceUsd).toBe(0.9998782611186441);
    expect(token("BUSD").priceUsd).toBe(0.9998782611186441);
  });

  it("drops rows without a usable price", () => {
    const result = normalizePrices([
      { currency: "A", date: "2023-01-01T00:00:00Z", price: 0 },
      { currency: "B", date: "2023-01-01T00:00:00Z", price: Number.NaN },
      { currency: "C", date: "2023-01-01T00:00:00Z", price: 2 },
    ]);
    expect(result.map((t) => t.symbol)).toEqual(["C"]);
  });

  it("finds an icon for every token, including the five with different casing", () => {
    expect(tokens.filter((t) => !t.icon).map((t) => t.symbol)).toEqual([]);
  });
});

describe("sanitizeAmount", () => {
  it.each([
    ["12.5", "12.5"],
    ["12,5", "12.5"],
    ["1.2.3", "1.23"],
    [".5", "0.5"],
    ["007", "7"],
    ["00.5", "0.5"],
    ["abc1e5", "15"],
    ["-3", "3"],
    ["0.123456789", "0.12345678"],
    ["", ""],
    ["0.", "0."],
  ])("%s -> %s", (raw, expected) => {
    expect(sanitizeAmount(raw)).toBe(expected);
  });
});

describe("amount helpers", () => {
  it("treats partial input as not entered", () => {
    expect(parseAmount("")).toBeNull();
    expect(parseAmount(".")).toBeNull();
    expect(parseAmount("0.")).toBe(0);
  });

  it("formats computed amounts for inputs", () => {
    expect(toInputString(1234.5678901)).toBe("1234.57");
    expect(toInputString(1.523419)).toBe("1.52342");
    expect(toInputString(0.004039850455)).toBe("0.00403985");
    expect(toInputString(0)).toBe("");
  });

  it("formats percentages", () => {
    expect(formatPercent(0.005)).toBe("0.5%");
    expect(formatPercent(0.00001)).toBe("< 0.01%");
  });
});

describe("quotes", () => {
  it("charges the fee and price impact on exact input", () => {
    const q = getQuote(1, ETH, USDC, 0.005)!;
    const market = ETH.priceUsd / USDC.priceUsd;
    expect(q.amountOut).toBeLessThan(market * (1 - LP_FEE));
    expect(q.amountOut).toBeGreaterThan(market * (1 - LP_FEE) * 0.98);
    expect(q.minReceived).toBeCloseTo(q.amountOut * 0.995, 8);
  });

  it("price impact grows with size and is graded like Uniswap", () => {
    const small = getQuote(0.1, ETH, USDC, 0.005)!;
    const large = getQuote(100, ETH, USDC, 0.005)!;
    expect(impactLevel(small.priceImpact)).toBe("low");
    expect(large.priceImpact).toBeGreaterThan(small.priceImpact);
    expect(impactLevel(0.02)).toBe("medium");
    expect(impactLevel(0.04)).toBe("high");
    expect(impactLevel(0.07)).toBe("severe");
    expect(impactLevel(0.2)).toBe("blocked");
  });

  it("returns null when there is nothing to swap", () => {
    expect(getQuote(0, ETH, USDC, 0.005)).toBeNull();
  });
});

describe("executeSwap", () => {
  const fast = { submit: 0, confirm: 0 };
  const quote = getQuote(1, ETH, USDC, 0.005)!;

  it("rejects amounts above the balance", async () => {
    await expect(
      executeSwap(quote, { balances: { ETH: 0.5 }, delays: fast }),
    ).rejects.toMatchObject({ reason: "balance" });
  });

  it("fails on slippage when the demo switch is on", async () => {
    await expect(
      executeSwap(quote, { balances: { ETH: 2 }, forceFailure: true, delays: fast }),
    ).rejects.toMatchObject({ reason: "slippage" });
  });

  it("reports each step and returns a receipt at the quoted amounts", async () => {
    const steps: string[] = [];
    const receipt = await executeSwap(quote, {
      balances: { ETH: 2 },
      onStep: (step) => steps.push(step),
      delays: fast,
    });
    expect(steps).toEqual(["submitting", "confirming"]);
    expect(receipt).toMatchObject({
      from: "ETH",
      to: "USDC",
      amountOut: quote.amountOut,
    });
  });
});

describe("checkSwap", () => {
  const quote = (amount: number) => getQuote(amount, USDC, ETH, 0.005);

  it("reports the first problem, in order", () => {
    expect(checkSwap(null, 100, "USDC").cta.label).toBe("Enter an amount");
    const short = checkSwap(quote(500), 100, "USDC");
    expect(short.cta.label).toBe("Insufficient USDC balance");
    expect(short.payError).toMatch(/You have 100 USDC/);
    expect(checkSwap(quote(30000), 1e6, "USDC").cta.label).toBe("Price impact too high");
  });

  it("allows the swap and colours the button by price impact", () => {
    expect(checkSwap(quote(100), 1e6, "USDC").cta).toEqual({
      label: "Review swap",
      disabled: false,
      tone: "primary",
    });
    expect(checkSwap(quote(4000), 1e6, "USDC").cta.tone).toBe("warning");
    expect(checkSwap(quote(8000), 1e6, "USDC").cta.tone).toBe("danger");
  });
});
