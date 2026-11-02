# Problem 2: Fancy Form

A token swap form built with **Vite + React + TypeScript**, no UI library. The layout and flow follow what users already know from established DEXs such as Uniswap, because familiarity is the biggest usability win in this category.

Requires Node.js 18 or newer.

```bash
npm install
npm run dev          # http://localhost:5173
npm test             # 38 tests: logic, state machine, and UI flows
npm run build        # type-check and production build
npm run build:demo   # one self-contained HTML file in demo/, runs offline
```

## What the user gets

**Entering a trade**
- Type an amount in "You pay"; "You receive" shows the result. Only the typed amount is stored; the received amount and the quote are derived on every render.
- Input is cleaned as you type: digits and one decimal point, comma accepted as a decimal separator, at most 8 decimals.
- `50%` and `Max` shortcuts, a USD value under every amount, and the price impact next to the received value once it passes 1%.
- Flip button: swaps the two tokens and keeps the typed amount, so flipping twice always returns exactly to where you started.

**Understanding the trade**
- A rate line (tap to invert) with a fee summary that expands into price impact, max slippage, minimum received, liquidity fee, network fee and route.
- The submit button doubles as the error message: "Enter an amount", "Insufficient ETH balance", "Price impact too high". It turns amber from 3% impact and red from 5%.

**Confirming**
- A review sheet shows the full trade before anything happens.
- Price impact of 5–15% requires an explicit acknowledgement; above 15% the swap is blocked (Uniswap's thresholds).
- Progress shows two steps (submitting, confirming). The sheet cannot be dismissed mid-swap.
- Success shows what was received. Failure explains why and offers "Try again"; when it failed on slippage, it also offers "Adjust slippage", the actual fix. There is no separate Close button: the X already dismisses.

**Around the form**
- Token picker: search (exact match first), popular tokens, "Your tokens" sorted by value, keyboard navigation, and a badge when a token is already on the other side (picking it flips the pair).
- Settings: max slippage of 0.1%, 0.5% (default) or 1%, and a demo switch to make the next swap fail.
- Light and dark themes, bottom sheets on phones, visible focus, focus trapped in dialogs and returned on close, the page behind a dialog made `inert`, text contrast of at least 4.5:1, reduced motion respected. Checked with axe-core: no issues.

## Assumptions

- The provided template was replaced, as the brief allows. The form keeps its purpose: an amount to send, an amount to receive, and a confirm action.
- Tokens without a price are left out, as the brief allows.
- There is no wallet or backend, so balances, pools, fees and execution are simulated (below) and labelled as simulated in the app.
- Prices are loaded once. In production they would be refreshed on an interval, with a "price updated" prompt on the review screen.

## Simulation (the brief has no backend)

| Piece | How it is simulated | Why |
|---|---|---|
| Prices | Loaded from the Switcheo feed with a 6 s timeout, falling back to a bundled snapshot. | The form always works, even offline. |
| Pools | A constant-product pool per pair with $100k of liquidity per side and a 0.3% fee. | Gives real price impact; the depth is shallow on purpose so the demo wallet can reach every warning level. |
| Wallet | Fixed starting balances, updated by swaps, reset on reload. | Enables balance checks, `Max`, and visible results. |
| Execution | 0.7 s submit, 1.5 s confirm, with a balance check. Settings has a switch that makes the next swap fail the way a real one does when the price moves past the slippage limit. | Shows the full lifecycle, including the failure path, on demand. |

## Data decisions

- **Duplicate prices.** The feed has 36 rows for 32 currencies; BUSD appears twice and USDC four times, sometimes with the same timestamp. The newest date wins, and on a tie the later row wins.
- **Icons.** All 32 priced tokens have an icon in the Switcheo repo, but five differ in letter case (`RATOM` vs `rATOM.svg`, and `STATOM`, `STEVMOS`, `STLUNA`, `STOSMO`). The icons are bundled under the exact names the feed uses, with a lettered fallback.

## Structure

```
src/
  App.tsx                   loads prices, app bar, skeleton, footnote
  state/
    useSwap.ts              form state, derived quote, review and execution
    flow.ts                 review → pending → success/error state machine
  hooks/
    useWallet.ts            demo balances
  lib/                      pure logic, no React
    prices.ts               fetch, timeout, fallback, de-duplication, icons
    quote.ts                pool maths, price impact, minimum received
    validate.ts             what the button says and whether the swap can go ahead
    amount.ts               input cleaning and number formatting
    wallet.ts               starting balances and simulated swap execution
  components/
    SwapCard.tsx            the screen: form and sheets
    AmountField.tsx         one side of the swap
    QuoteDetails.tsx        rate and expandable details
    TokenPicker.tsx         searchable, grouped, keyboard-friendly
    ReviewSheet.tsx         review, progress, success, failure
    SettingsSheet.tsx       slippage and the demo switch
    Sheet.tsx               accessible dialog / bottom sheet
    TokenIcon.tsx, icons.tsx
  assets/                   32 token icons, 2 variable fonts (OFL)
```

## Known limits

- Amounts use JavaScript numbers. Fine for a demo; a real swap should compute in integer base units or with a decimal library.
- Prices, pools, fees and execution are simulated as described above.
