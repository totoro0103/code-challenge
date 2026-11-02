import snapshot from "../data/prices.snapshot.json";

/** One row of https://interview.switcheo.com/prices.json */
export interface PriceEntry {
  currency: string;
  date: string;
  price: number;
}

export interface Token {
  symbol: string;
  priceUsd: number;
  updatedAt: string;
  icon: string | undefined;
}

export type PriceSource = "live" | "snapshot";

export const PRICES_URL = "https://interview.switcheo.com/prices.json";

// Icons are bundled (named exactly as the price feed spells each symbol), so
// they work offline and in the single-file demo build.
const iconModules = import.meta.glob<string>("../assets/tokens/*.svg", {
  eager: true,
  query: "?url",
  import: "default",
});
/** "../assets/tokens/ETH.svg" -> "ETH" */
const symbolFromPath = (path: string) => path.split("/").pop()!.replace(".svg", "");

/** Symbol -> icon URL, e.g. { ETH: "/assets/ETH-3f2a.svg" } */
const ICONS: Record<string, string> = {};
for (const [path, url] of Object.entries(iconModules)) {
  ICONS[symbolFromPath(path)] = url;
}

/**
 * Turns the raw feed into one token per currency.
 *
 * The feed repeats some currencies (BUSD twice, USDC four times), sometimes
 * with the same timestamp but different prices. Rule: the newest date wins,
 * and on a tie the row that appears later in the file wins.
 * Rows without a positive, finite price are dropped, as the brief allows.
 */
export function normalizePrices(entries: PriceEntry[]): Token[] {
  const latest = new Map<string, PriceEntry>();

  for (const entry of entries) {
    // Skip broken rows: no name, or a price that isn't a positive number.
    if (typeof entry?.currency !== "string" || entry.currency === "") continue;
    if (!Number.isFinite(entry.price) || entry.price <= 0) continue;

    const previous = latest.get(entry.currency);
    const isNewerOrSame =
      !previous || Date.parse(entry.date) >= Date.parse(previous.date);
    if (isNewerOrSame) latest.set(entry.currency, entry);
  }

  return [...latest.values()]
    .map((entry) => ({
      symbol: entry.currency,
      priceUsd: entry.price,
      updatedAt: entry.date,
      icon: ICONS[entry.currency],
    }))
    .sort((a, b) => a.symbol.localeCompare(b.symbol, "en", { sensitivity: "base" }));
}

/**
 * Loads live prices, falling back to the bundled snapshot if the request
 * fails or takes longer than `timeoutMs`, so the form always works.
 */
export async function loadTokens(
  timeoutMs = 6000,
): Promise<{ tokens: Token[]; source: PriceSource }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(PRICES_URL, { signal: controller.signal });
    // fetch only rejects on network errors, so HTTP errors are checked here.
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const tokens = normalizePrices((await response.json()) as PriceEntry[]);
    // A swap needs at least two tokens; anything less means a broken feed.
    if (tokens.length < 2) throw new Error("Not enough priced tokens");
    return { tokens, source: "live" };
  } catch {
    return { tokens: normalizePrices(snapshot as PriceEntry[]), source: "snapshot" };
  } finally {
    clearTimeout(timer);
  }
}
