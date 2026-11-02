# Problem 3: Messy React

The issues are grouped by impact. Each one says what is wrong, why it matters, and how the refactor in [`WalletPage.tsx`](./WalletPage.tsx) fixes it.

I type-checked the original code with `strict` TypeScript against minimal stubs for the hooks and `WalletRow`. It fails with 10 errors, several of which are runtime bugs, listed first.

## A. Bugs: wrong output or crashes

**1. `lhsPriority` is not defined.**
The filter computes `balancePriority` and then checks `lhsPriority`, which does not exist. TypeScript rejects it (`Cannot find name 'lhsPriority'`); if it ran, it would throw a `ReferenceError` on the first balance.
*Fix:* use the value that was computed.

**2. The filter keeps the wrong balances.**
It returns `true` when `balance.amount <= 0`, so the page shows only empty or negative balances and hides every real one.
*Fix:* keep `amount > 0`.

**3. `WalletBalance` has no `blockchain` field.**
`getPriority(balance.blockchain)` reads a property the interface does not declare (3 type errors). Typing the parameter `any` hid the mismatch inside `getPriority`.
*Fix:* add `blockchain: string` to `WalletBalance`.

**4. Rows read `formatted` from data that does not have it.**
`formattedBalances` is computed and never used; `rows` maps over `sortedBalances` instead and reads `balance.formatted`, which is `undefined`. Annotating the callback parameter as `FormattedWalletBalance` claims a shape the array does not have. With correct types TypeScript rejects it; if `useWalletBalances` returns `any`, the bug ships silently.
*Fix:* format in one place, from the data actually rendered.

**5. The sort comparator returns `undefined` for equal priorities.**
At runtime `undefined` is treated as `0`, so the order happens to be right, but it relies on an implicit coercion and fails type-checking (`Type 'number | undefined' is not assignable to type 'number'`).
*Fix:* `(a, b) => b.priority - a.priority`, which covers all three cases.

**6. `prices[balance.currency]` can be `undefined`.**
A currency without a price gives `usdValue = NaN`, which then renders or breaks any total.
*Fix:* default to `0` (or show "price unavailable").

**7. `classes` is never defined or imported.**
`className={classes.row}` throws a `ReferenceError` at render.
*Fix:* import the styles (shown as a CSS module).

**8. `...rest` is spread onto a `<div>`, but `Props` extends `BoxProps`.**
Box-only props such as `sx`, `p` or `display` are forwarded to the DOM: React warns about unknown attributes and the styles are silently dropped.
*Fix:* render `<Box {...rest}>`.

**9. `children` is destructured and then dropped.**
Anything passed as children disappears without an error.
*Fix:* render `{children}` (or remove it from the props if the page should not accept any). I render it.

## B. Computational inefficiencies

**10. `prices` is in the `useMemo` dependencies but not used inside it.**
Every price update (often frequent) re-runs the filter and sort for nothing.
*Fix:* depend on `balances` only.

**11. `getPriority` is recreated on every render.**
It is a pure function of its argument and uses nothing from the component. Defining it inside the component also makes it a missing `useMemo` dependency (`react-hooks/exhaustive-deps` warns).
*Fix:* move it, and its lookup table, to module scope.

**12. `getPriority` runs inside the comparator.**
The sort calls it twice per comparison, about 2·n·log n times, for values that never change during the sort.
*Fix:* compute each priority once (map to `{ balance, priority }`), then filter and sort on that.

**13. Two separate passes over the same array, neither memoised.**
`formattedBalances` and `rows` each map over `sortedBalances` on every render, and `formattedBalances` is thrown away.
*Fix:* one memoised pass that builds the rows, depending on `[sortedBalances, prices]`.

## C. Anti-patterns and code smells

**14. `key={index}`.**
When the list is re-sorted or filtered, React matches rows by position, so it reuses the wrong components and their state.
*Fix:* a stable key from the data. `currency` alone is not unique across chains, so I use `` `${blockchain}:${currency}` ``.

**15. `blockchain: any`.**
Turns off type-checking for the one input that drives filtering and sorting.
*Fix:* `string`, with the known chains in a typed lookup table.

**16. A `switch` used as a lookup table, with a magic number.**
`-99` appears twice with no name, and the table is code rather than data.
*Fix:* a `Map` of priorities and an `UNSUPPORTED_PRIORITY` constant. A `Map` also avoids prototype keys like `"toString"` that a plain object would match.

**17. `toFixed()` with no argument.**
It rounds to 0 decimals, so `0.75` is shown as `"1"`.
*Fix:* `Intl.NumberFormat` with explicit fraction digits, created once at module scope.

**18. Duplicated and empty types.**
`FormattedWalletBalance` repeats every field of `WalletBalance` instead of extending it, and `interface Props extends BoxProps {}` adds nothing.
*Fix:* `type Props = BoxProps`; the separate formatted type is no longer needed.

**19. Unused variable and redundant annotation.**
`balancePriority` is never read, and `React.FC<Props> = (props: Props)` declares the type twice.
*Fix:* removed; props are destructured in the signature.

## Assumptions

- `BoxProps` comes from MUI, so `Box` is used for the wrapper.
- `usePrices()` returns `Record<string, number>` keyed by currency, and returns a stable object between renders. If it returns a new object each render, it should be memoised in the hook; otherwise `rows` recomputes every time.
- Balances on chains missing from the priority table are hidden, as in the original.
- Six fraction digits is a reasonable display precision; the original intent of `toFixed()` is unknown.
