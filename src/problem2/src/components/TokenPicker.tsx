import { useEffect, useMemo, useRef, useState } from "react";
import type { Token } from "../lib/prices";
import { formatAmount, formatUsd } from "../lib/amount";
import { Sheet } from "./Sheet";
import { TokenIcon } from "./TokenIcon";
import { Check, Search } from "./icons";

interface TokenPickerProps {
  title: string;
  tokens: Token[];
  balances: Record<string, number>;
  selected: string;
  /** The token on the other side; picking it swaps the pair. */
  opposite: string;
  onSelect: (symbol: string) => void;
  onClose: () => void;
}

const POPULAR = ["ETH", "USDC", "WBTC", "ATOM", "OSMO", "SWTH"];

const usdValue = (token: Token, balances: Record<string, number>) =>
  (balances[token.symbol] ?? 0) * token.priceUsd;

/**
 * Filters by the search text, then splits into two groups:
 *   held   - tokens the user owns, most valuable first
 *   others - everything else, alphabetical
 * An exact match ("eth" -> ETH) goes to the top of its group, above wstETH.
 * `flat` is both groups in display order, used for arrow-key navigation.
 */
function groupTokens(tokens: Token[], balances: Record<string, number>, query: string) {
  const search = query.trim().toLowerCase();
  const matches = search
    ? tokens.filter((t) => t.symbol.toLowerCase().includes(search))
    : tokens;

  const isExact = (t: Token) => t.symbol.toLowerCase() === search;
  const exactFirst = (a: Token, b: Token) => Number(isExact(b)) - Number(isExact(a));
  const owns = (t: Token) => (balances[t.symbol] ?? 0) > 0;

  const held = matches
    .filter(owns)
    .sort((a, b) => exactFirst(a, b) || usdValue(b, balances) - usdValue(a, balances));
  const others = matches.filter((t) => !owns(t)).sort(exactFirst);

  return { held, others, flat: [...held, ...others] };
}

/**
 * Searchable token list. Held tokens come first, sorted by USD value.
 * Arrow keys move through the list, Enter picks, Escape closes.
 */
export function TokenPicker({
  title,
  tokens,
  balances,
  selected,
  opposite,
  onSelect,
  onClose,
}: TokenPickerProps) {
  const [query, setQuery] = useState("");
  // Index of the row highlighted by the arrow keys.
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  const { held, others, flat } = useMemo(
    () => groupTokens(tokens, balances, query),
    [tokens, balances, query],
  );

  useEffect(() => setActive(0), [query]);
  useEffect(() => {
    listRef.current
      ?.querySelector<HTMLElement>(`[data-index="${active}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((i) => Math.min(i + 1, flat.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (event.key === "Enter" && flat[active]) {
      event.preventDefault();
      onSelect(flat[active].symbol);
    }
  };

  const popular = tokens.filter((t) => POPULAR.includes(t.symbol));

  const renderRow = (token: Token, index: number) => {
    const balance = balances[token.symbol] ?? 0;
    const isSelected = token.symbol === selected;
    return (
      <li
        key={token.symbol}
        id={`token-option-${token.symbol}`}
        data-index={index}
        role="option"
        aria-selected={isSelected}
        className={`token-row${index === active ? " is-active" : ""}`}
        onMouseMove={() => setActive(index)}
        onClick={() => onSelect(token.symbol)}
      >
        <TokenIcon token={token} size={36} />
        <span className="token-row__name">
          <span className="token-row__symbol">{token.symbol}</span>
          <span className="token-row__sub">
            {formatUsd(token.priceUsd)}
            {token.symbol === opposite && <span className="badge">Other side</span>}
          </span>
        </span>
        {balance > 0 && (
          <span className="token-row__balance">
            <span>{formatAmount(balance)}</span>
            <span className="token-row__sub">{formatUsd(usdValue(token, balances))}</span>
          </span>
        )}
        {isSelected && (
          <span className="token-row__check">
            <Check />
          </span>
        )}
      </li>
    );
  };

  return (
    <Sheet title={title} onClose={onClose} focusFirstInput>
      <div className="picker" onKeyDown={onKeyDown}>
        <div className="search">
          <Search />
          <input
            type="search"
            placeholder="Search by symbol"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Search tokens"
            aria-controls="token-listbox"
            aria-activedescendant={
              flat[active] ? `token-option-${flat[active].symbol}` : undefined
            }
            autoComplete="off"
            spellCheck={false}
          />
        </div>

        {!query && (
          <div className="popular" aria-label="Popular tokens">
            {popular.map((token) => (
              <button
                key={token.symbol}
                type="button"
                className={`popular__chip${token.symbol === selected ? " is-selected" : ""}`}
                onClick={() => onSelect(token.symbol)}
              >
                <TokenIcon token={token} size={20} />
                {token.symbol}
              </button>
            ))}
          </div>
        )}

        <div className="picker__list" ref={listRef}>
          {flat.length === 0 ? (
            <p className="picker__empty">
              No token matches “{query}”. Check the spelling or try a shorter symbol.
            </p>
          ) : (
            <ul id="token-listbox" role="listbox" aria-label={title}>
              {held.length > 0 && (
                <li role="presentation" className="picker__group">
                  Your tokens
                </li>
              )}
              {held.map((token, i) => renderRow(token, i))}
              {others.length > 0 && (
                <li role="presentation" className="picker__group">
                  {held.length > 0 ? "All tokens" : "Tokens"}
                </li>
              )}
              {/* Row numbers continue after the held tokens, for the arrow keys. */}
              {others.map((token, i) => renderRow(token, held.length + i))}
            </ul>
          )}
        </div>
      </div>
    </Sheet>
  );
}
