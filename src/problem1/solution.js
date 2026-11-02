/**
 * Problem 1: Three ways to sum to n
 *
 * sum_to_n(n) returns 1 + 2 + ... + n.
 *
 * Assumptions (the brief only says "any integer"):
 *   - n = 0 returns 0 (empty sum).
 *   - n < 0 returns the mirrored sum: sum_to_n(-n) negated,
 *     i.e. sum_to_n(-3) === -1 + -2 + -3 === -6.
 *   - n is a safe integer and |result| <= Number.MAX_SAFE_INTEGER,
 *     as guaranteed by the brief. The largest valid |n| is therefore
 *     134,217,727 (2^27 - 1).
 */

/**
 * A. Closed-form formula (Gauss): n * (n + 1) / 2
 * Time O(1), space O(1).
 *
 * Precision: n * (n + 1) can exceed MAX_SAFE_INTEGER (2^53 - 1) before the
 * division, but it is always even and below 2^54, and every even integer
 * below 2^54 is exactly representable as a double. So no precision is lost.
 */
var sum_to_n_a = function (n) {
  var m = Math.abs(n);
  var sum = (m * (m + 1)) / 2;
  return n < 0 ? -sum : sum;
};

/**
 * B. Iterative loop.
 * Time O(n), space O(1).
 *
 * Every partial sum is smaller than the final result, so it stays exact.
 */
var sum_to_n_b = function (n) {
  var m = Math.abs(n);
  var sum = 0;
  for (var i = 1; i <= m; i++) {
    sum += i;
  }
  return n < 0 ? -sum : sum;
};

/**
 * C. Recursive halving (divide and conquer).
 * Time O(log n), recursion depth O(log n), space O(log n).
 *
 * Split 1..2k into odd and even numbers:
 *   evens: 2 + 4 + ... + 2k        = 2 * S(k)
 *   odds:  1 + 3 + ... + (2k - 1)  = k^2
 * so S(2k) = 2 * S(k) + k^2, and S(2k + 1) = S(2k) + (2k + 1).
 *
 * A naive recursion S(n) = n + S(n - 1) needs n stack frames and throws
 * "Maximum call stack size exceeded" around n = 10,000, far below the
 * largest valid input. Halving keeps the depth at about 2 * log2(n),
 * roughly 54 frames for the largest valid n.
 */
var sum_to_n_c = function (n) {
  if (n < 0) return -sum_to_n_c(-n);
  if (n === 0) return 0;
  if (n % 2 === 1) return sum_to_n_c(n - 1) + n;
  var k = n / 2;
  return 2 * sum_to_n_c(k) + k * k;
};

// Export for Node (tests); harmless in the browser.
if (typeof module !== "undefined" && module.exports) {
  module.exports = { sum_to_n_a, sum_to_n_b, sum_to_n_c };
}
