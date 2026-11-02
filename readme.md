# 99Tech Code Challenge: Frontend

Solutions to the three frontend problems. Each folder has its own README with the approach, assumptions and decisions.

| Problem | Folder | Summary |
|---|---|---|
| 1. Three ways to sum to n | [`src/problem1`](./src/problem1) | Formula O(1), loop O(n), recursive halving O(log n). Tested against a BigInt reference up to the largest valid input. |
| 2. Fancy Form | [`src/problem2`](./src/problem2) | Token swap form in Vite, React and TypeScript: review step, slippage, price impact warnings, full swap lifecycle. 38 tests. |
| 3. Messy React | [`src/problem3`](./src/problem3) | 19 issues grouped by impact, each with a fix, plus a refactored component. The original fails strict type-checking with 10 errors. |

Live demo of problem 2: [code-challenge-99tech.vercel.app](https://code-challenge-99tech.vercel.app/)

## Running

```bash
# Problem 1
cd src/problem1 && node solution.test.js

# Problem 2 (Node.js 18+)
cd src/problem2 && npm install && npm test && npm run dev
```

Problems 4 and 5 are backend problems and were not part of the frontend track.
