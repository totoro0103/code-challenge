# Problem 1: Three ways to sum to n

`sum_to_n(n)` returns `1 + 2 + ... + n`, e.g. `sum_to_n(5) === 15`.

## Assumptions

The brief says `n` is "any integer", so:

- `n = 0` returns `0` (empty sum).
- `n < 0` returns the mirrored sum: `sum_to_n(-3) === -1 + -2 + -3 === -6`.
- The result is guaranteed to be below `Number.MAX_SAFE_INTEGER`, so the largest valid `|n|` is **134,217,727** (2^27 − 1). All three implementations are tested up to this bound.
- Inputs are trusted to be integers, as the brief states; no type validation is added.

## Implementations

| | Approach | Time | Space |
|---|---|---|---|
| `sum_to_n_a` | Gauss formula `n(n+1)/2` | O(1) | O(1) |
| `sum_to_n_b` | Iterative loop | O(n) | O(1) |
| `sum_to_n_c` | Recursive halving | O(log n) | O(log n) stack |

**A — Formula.** The intermediate `n * (n + 1)` can exceed `MAX_SAFE_INTEGER`, but it is always even and below 2^54, and every even integer below 2^54 is exactly representable as a double, so the result stays exact. This is verified against a BigInt reference at the maximum input.

**B — Loop.** The most readable approach. Each partial sum is smaller than the final result, so it never loses precision. Takes about 0.1 s at the maximum input.

**C — Recursive halving.** Splitting `1..2k` into evens (`2·S(k)`) and odds (`k²`) gives `S(2k) = 2·S(k) + k²` and `S(2k+1) = S(2k) + 2k + 1`. Recursion depth is about `2·log₂(n)`, roughly 54 frames at the maximum input.

### Approaches considered and rejected

- **Naive recursion** `n + S(n − 1)`: one stack frame per number, so it throws `Maximum call stack size exceeded` at around n = 10,000. JavaScript engines (V8) do not perform tail-call optimisation, so rewriting it tail-recursively does not help.
- **`Array.from(...).reduce(...)`**: works, but allocates an array of `n` numbers (about 1 GB at the maximum input) just to add them up.

## Run

```bash
node solution.test.js
```

The tests check fixed cases (including 0 and negatives), 200 random inputs per implementation, and the ±134,217,727 boundary, all against an exact BigInt reference.
