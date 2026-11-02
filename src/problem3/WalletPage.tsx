import { useMemo } from "react";
// Assumption: BoxProps in the original comes from MUI, so the props belong on <Box>.
import { Box, type BoxProps } from "@mui/material";
import { useWalletBalances } from "../hooks/useWalletBalances";
import { usePrices } from "../hooks/usePrices";
import { WalletRow } from "./WalletRow";
import classes from "./WalletPage.module.css";

interface WalletBalance {
  currency: string;
  amount: number;
  blockchain: string; // was missing, yet the original code reads it
}

type Props = BoxProps;

/** Balances on chains outside this table are not shown. */
const UNSUPPORTED_PRIORITY = -99;

// Module scope: built once, not on every render. A Map (unlike a plain
// object) cannot accidentally match keys such as "toString".
const BLOCKCHAIN_PRIORITY = new Map<string, number>([
  ["Osmosis", 100],
  ["Ethereum", 50],
  ["Arbitrum", 30],
  ["Zilliqa", 20],
  ["Neo", 20],
]);

const getPriority = (blockchain: string): number =>
  BLOCKCHAIN_PRIORITY.get(blockchain) ?? UNSUPPORTED_PRIORITY;

const amountFormat = new Intl.NumberFormat("en-US", { maximumFractionDigits: 6 });

export const WalletPage = ({ children, ...rest }: Props) => {
  const balances: WalletBalance[] = useWalletBalances();
  const prices: Record<string, number> = usePrices();

  // Depends on balances only: prices are not used to filter or sort.
  const sortedBalances = useMemo(
    () =>
      balances
        // Look each priority up once, instead of inside every comparison.
        .map((balance) => ({ balance, priority: getPriority(balance.blockchain) }))
        .filter(
          ({ balance, priority }) =>
            priority > UNSUPPORTED_PRIORITY && balance.amount > 0,
        )
        // Highest priority first. Array.prototype.sort is stable, so equal
        // priorities keep their original order.
        .sort((a, b) => b.priority - a.priority)
        .map(({ balance }) => balance),
    [balances],
  );

  const rows = useMemo(
    () =>
      sortedBalances.map((balance) => (
        <WalletRow
          // The same currency can exist on several chains, so both form the key.
          key={`${balance.blockchain}:${balance.currency}`}
          className={classes.row}
          amount={balance.amount}
          usdValue={(prices[balance.currency] ?? 0) * balance.amount}
          formattedAmount={amountFormat.format(balance.amount)}
        />
      )),
    [sortedBalances, prices],
  );

  return (
    <Box {...rest}>
      {rows}
      {children}
    </Box>
  );
};
