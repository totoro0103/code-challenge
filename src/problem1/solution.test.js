// Run with: node solution.test.js
const assert = require("node:assert/strict");
const { sum_to_n_a, sum_to_n_b, sum_to_n_c } = require("./solution");

const impls = { sum_to_n_a, sum_to_n_b, sum_to_n_c };
const MAX_N = 134217727; // largest n with n(n+1)/2 <= Number.MAX_SAFE_INTEGER

// Exact reference using BigInt, independent of the implementations.
const reference = (n) => {
  const m = BigInt(Math.abs(n));
  const sum = Number((m * (m + 1n)) / 2n);
  return n < 0 ? -sum : sum;
};

const cases = [
  [5, 15],
  [1, 1],
  [0, 0],
  [2, 3],
  [10, 55],
  [100, 5050],
  [-1, -1],
  [-3, -6],
  [-100, -5050],
];

for (const [name, fn] of Object.entries(impls)) {
  for (const [n, expected] of cases) {
    assert.equal(fn(n), expected, `${name}(${n})`);
  }

  // Random inputs up to 1,000,000 compared against the BigInt reference.
  for (let i = 0; i < 200; i++) {
    const n = Math.floor(Math.random() * 2_000_001) - 1_000_000;
    assert.equal(fn(n), reference(n), `${name}(${n})`);
  }

  console.log(`✓ ${name}`);
}

// Boundary: the largest valid input. The loop takes a moment here.
for (const [name, fn] of Object.entries(impls)) {
  for (const n of [MAX_N, -MAX_N]) {
    assert.equal(fn(n), reference(n), `${name}(${n})`);
  }
  console.log(`✓ ${name} at ±${MAX_N}`);
}

console.log("All tests passed.");
