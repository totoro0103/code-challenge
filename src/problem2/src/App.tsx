import { useEffect, useState } from "react";
import { loadTokens, type PriceSource, type Token } from "./lib/prices";
import { SwapCard } from "./components/SwapCard";

interface Loaded {
  tokens: Token[];
  source: PriceSource;
}

export default function App() {
  // null while the prices are loading.
  const [loaded, setLoaded] = useState<Loaded | null>(null);

  useEffect(() => {
    // If the app unmounts before the prices arrive, don't set state.
    let cancelled = false;
    loadTokens().then((result) => {
      if (!cancelled) setLoaded(result);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="app">
      <header className="appbar">
        <span className="brand">
          <svg width="26" height="26" viewBox="0 0 32 32" aria-hidden="true">
            <rect width="32" height="32" rx="9" className="brand__tile" />
            <path
              d="M10 12.5h12m0 0l-3.5-3.5M22 12.5L18.5 16M22 19.5H10m0 0l3.5 3.5M10 19.5l3.5-3.5"
              className="brand__mark"
            />
          </svg>
          Switch
        </span>
        <span className="wallet-pill" title="Balances are simulated">
          <span className="wallet-pill__dot" aria-hidden="true" />
          Demo wallet
        </span>
      </header>

      <main className="layout">
        {loaded ? (
          <SwapCard tokens={loaded.tokens} />
        ) : (
          <section className="card" aria-busy="true" aria-label="Loading prices">
            <div className="skeleton skeleton--title" />
            <div className="skeleton skeleton--field" />
            <div className="skeleton skeleton--field" />
            <div className="skeleton skeleton--cta" />
          </section>
        )}

        {loaded && <Footnote source={loaded.source} />}
      </main>
    </div>
  );
}

/** Says where prices come from and what is simulated. */
function Footnote({ source }: { source: PriceSource }) {
  const origin =
    source === "live"
      ? "Prices come from the Switcheo feed (a 2023 snapshot)"
      : "Live prices are unavailable, so a saved copy of the Switcheo feed is used";
  return <p className="footnote">{origin}. Balances, fees and swaps are simulated.</p>;
}
