import Link from "next/link";
import { connection } from "next/server";
import { TriangleAlert } from "lucide-react";
import { ExpenseChart } from "@/components/expense-chart";
import { TransactionTable } from "@/components/transaction-table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { UrlSelect } from "@/components/url-select";
import { db } from "@/lib/db";
import {
  buildHoldings,
  cashBalance,
  expensesByCategory,
  inMonth,
  totalOfType,
} from "@/lib/finance";
import {
  currentMonthKey,
  formatMonth,
  formatUSD,
  isMonthKey,
  monthKey,
} from "@/lib/format";
import { getQuotes } from "@/lib/prices";

function StatCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl">{value}</CardTitle>
        {detail && <CardDescription>{detail}</CardDescription>}
      </CardHeader>
    </Card>
  );
}

// Every page reads the database at request time, so none can be prerendered.
export const instant = false;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  await connection();
  const params = await searchParams;

  const [transactions, stocks] = await Promise.all([
    db.transaction.findMany({
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    }),
    db.stock.findMany(),
  ]);
  const quotes = await getQuotes(stocks.map((s) => s.ticker));
  const { total: portfolioValue, missing } = buildHoldings(stocks, quotes);

  const thisMonth = currentMonthKey();
  const month = isMonthKey(params.month) ? params.month : thisMonth;
  const months = [
    ...new Set([thisMonth, month, ...transactions.map((t) => monthKey(t.date))]),
  ].sort((a, b) => b.localeCompare(a));

  const cash = cashBalance(transactions);
  const currentTransactions = inMonth(transactions, thisMonth);
  const monthExpenses = expensesByCategory(inMonth(transactions, month));

  return (
    <>
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      {missing.length > 0 && (
        <p
          role="alert"
          className="flex items-center gap-2 rounded-lg border bg-background p-3 text-sm"
        >
          <TriangleAlert className="size-4 shrink-0" aria-hidden />
          Net worth is partial: no price available for {missing.join(", ")}.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={missing.length > 0 ? "Net Worth (partial)" : "Net Worth"}
          value={formatUSD(cash + portfolioValue)}
        />
        <StatCard label="Cash Balance" value={formatUSD(cash)} />
        <StatCard
          label={missing.length > 0 ? "Portfolio Value (partial)" : "Portfolio Value"}
          value={formatUSD(portfolioValue)}
        />
        <StatCard
          label="Income this month"
          value={formatUSD(totalOfType(currentTransactions, "INCOME"))}
          detail={`Expenses: ${formatUSD(totalOfType(currentTransactions, "EXPENSE"))}`}
        />
      </div>

      <Card>
        <CardHeader className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle>Expenses by category</CardTitle>
          <UrlSelect
            param="month"
            label="Month"
            value={month}
            options={months.map((m) => ({ value: m, label: formatMonth(m) }))}
          />
        </CardHeader>
        <CardContent>
          {monthExpenses.length > 0 ? (
            <ExpenseChart
              month={monthExpenses}
              allTime={expensesByCategory(transactions)}
            />
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No expenses in {formatMonth(month)}.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex items-center justify-between gap-2">
          <CardTitle>Recent transactions</CardTitle>
          <Link href="/transactions" className="text-sm underline">
            View all
          </Link>
        </CardHeader>
        <CardContent>
          {transactions.length > 0 ? (
            <TransactionTable
              transactions={transactions.slice(0, 5)}
              editable={false}
            />
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No transactions yet.
            </p>
          )}
        </CardContent>
      </Card>
    </>
  );
}
