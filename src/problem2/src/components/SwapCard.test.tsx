import { describe, expect, it } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import snapshot from "../data/prices.snapshot.json";
import { normalizePrices, type PriceEntry } from "../lib/prices";
import { SwapCard } from "./SwapCard";

const tokens = normalizePrices(snapshot as PriceEntry[]);
const setup = () => {
  const user = userEvent.setup();
  render(<SwapCard tokens={tokens} />);
  return {
    user,
    pay: screen.getByLabelText("You pay") as HTMLInputElement,
    receive: screen.getByLabelText("You receive") as HTMLInputElement,
    cta: () =>
      screen.getByRole("button", {
        name: /amount|review|insufficient|liquidity|impact/i,
      }),
  };
};

describe("SwapCard", () => {
  it("derives the receive amount and explains the disabled button", async () => {
    const { user, pay, receive, cta } = setup();
    expect(cta()).toHaveProperty("disabled", true);
    expect(cta().textContent).toBe("Enter an amount");

    await user.type(pay, "1,5");
    expect(pay.value).toBe("1.5");
    expect(Number(receive.value)).toBeGreaterThan(2000);
    expect(cta().textContent).toBe("Review swap");
  });

  it("shows the receive amount as a read-only result", () => {
    const { receive } = setup();
    expect(receive.readOnly).toBe(true);
  });

  it("blocks amounts above the balance with a helpful message", async () => {
    const { user, pay, cta } = setup();
    await user.type(pay, "5");
    expect(cta().textContent).toBe("Insufficient ETH balance");
    expect(screen.getByRole("alert").textContent).toMatch(/You have 2.5 ETH/);
  });

  it("fills the balance with Max and flips the pair", async () => {
    const { user, pay, receive } = setup();
    await user.click(screen.getByRole("button", { name: "Max" }));
    expect(pay.value).toBe("2.5");
    const received = receive.value;
    const flipButton = screen.getByRole("button", { name: /switch the tokens/i });

    await user.click(flipButton);
    // The tokens swap; the typed amount stays.
    expect(pay.value).toBe("2.5");
    expect(screen.getByRole("button", { name: /You pay: USDC/ })).toBeTruthy();

    // Flipping twice returns exactly to where we started.
    await user.click(flipButton);
    expect(pay.value).toBe("2.5");
    expect(receive.value).toBe(received);
    expect(screen.getByRole("button", { name: /You pay: ETH/ })).toBeTruthy();
  });

  it("searches and picks a token from the picker", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: /You receive: USDC/ }));
    const dialog = screen.getByRole("dialog", { name: "You receive" });
    await user.type(within(dialog).getByLabelText("Search tokens"), "atom");
    await user.keyboard("{Enter}");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByRole("button", { name: /You receive: ATOM/ })).toBeTruthy();
  });

  it("reviews, confirms and completes a swap, then updates the balance", async () => {
    const { user, pay, cta } = setup();
    await user.type(pay, "1");
    await user.click(cta());
    const dialog = screen.getByRole("dialog", { name: "Review swap" });
    await user.click(within(dialog).getByRole("button", { name: "Confirm swap" }));
    await waitFor(() => screen.getByRole("dialog", { name: "Swap complete" }), {
      timeout: 4000,
    });
    await user.click(screen.getByRole("button", { name: "Done" }));
    expect(screen.getByText(/Balance 1.5$/)).toBeTruthy();
  });

  it("shows the failure path and lets the user retry", async () => {
    const { user, pay, cta } = setup();
    await user.click(screen.getByRole("button", { name: "Settings" }));
    await user.click(screen.getByRole("switch", { name: /next swap fail/ }));
    await user.keyboard("{Escape}");
    await user.type(pay, "1");
    await user.click(cta());
    await user.click(screen.getByRole("button", { name: "Confirm swap" }));
    await waitFor(() => screen.getByRole("dialog", { name: "Swap failed" }), {
      timeout: 4000,
    });
    // One way to dismiss (the X); the footer only offers ways forward.
    expect(screen.getAllByRole("button", { name: /close/i })).toHaveLength(1);
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(screen.getByRole("dialog", { name: "Review swap" })).toBeTruthy();
  });

  it("offers to adjust slippage when a swap fails on slippage", async () => {
    const { user, pay, cta } = setup();
    await user.click(screen.getByRole("button", { name: "Settings" }));
    await user.click(screen.getByRole("switch", { name: /next swap fail/ }));
    await user.keyboard("{Escape}");
    await user.type(pay, "1");
    await user.click(cta());
    await user.click(screen.getByRole("button", { name: "Confirm swap" }));
    await waitFor(() => screen.getByRole("dialog", { name: "Swap failed" }), {
      timeout: 4000,
    });
    await user.click(screen.getByRole("button", { name: "Adjust slippage" }));
    expect(screen.getByRole("dialog", { name: "Settings" })).toBeTruthy();
    // The amount survives, so the user can retry after changing the limit.
    expect(pay.value).toBe("1");
  });
});
