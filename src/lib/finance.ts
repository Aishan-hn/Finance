import { monthKey } from "@/lib/format";

export type Quote = {
  ticker: string;
  price: number;
  change: number | null;
  priceDate: Date;
  /** True when this is an older value kept because the latest fetch failed. */
  stale: boolean;
};

type TransactionLike = {
  type: string;
  amount: number;
  category: string;
  date: Date;
};

type StockLike = { id: string; ticker: string; shares: number };

export type Holding = StockLike & {
  quote: Quote | null;
  value: number | null;
  weight: number | null;
};

export type CategoryTotal = { category: string; total: number };

export const signedAmount = (t: TransactionLike) =>
  t.type === "INCOME" ? t.amount : -t.amount;

export function cashBalance(transactions: TransactionLike[]) {
  return transactions.reduce((sum, t) => sum + signedAmount(t), 0);
}

export function inMonth<T extends TransactionLike>(
  transactions: T[],
  month: string,
) {
  return transactions.filter((t) => monthKey(t.date) === month);
}

export function totalOfType(transactions: TransactionLike[], type: string) {
  return transactions
    .filter((t) => t.type === type)
    .reduce((sum, t) => sum + t.amount, 0);
}

/** Expense totals per category, largest first. */
export function expensesByCategory(
  transactions: TransactionLike[],
): CategoryTotal[] {
  const totals = new Map<string, number>();
  for (const t of transactions) {
    if (t.type !== "EXPENSE") continue;
    totals.set(t.category, (totals.get(t.category) ?? 0) + t.amount);
  }
  return [...totals]
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);
}

/**
 * Tickers without a price have a null value and are left out of the total,
 * so callers must surface `missing` rather than treating them as $0.
 */
export function buildHoldings(
  stocks: StockLike[],
  quotes: Map<string, Quote>,
) {
  const valued = stocks.map((stock) => {
    const quote = quotes.get(stock.ticker) ?? null;
    return { ...stock, quote, value: quote ? quote.price * stock.shares : null };
  });
  const total = valued.reduce((sum, h) => sum + (h.value ?? 0), 0);
  const holdings: Holding[] = valued.map((h) => ({
    ...h,
    weight: h.value !== null && total > 0 ? h.value / total : null,
  }));
  const missing = holdings.filter((h) => !h.quote).map((h) => h.ticker);
  return { holdings, total, missing };
}
