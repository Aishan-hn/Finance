import { connection } from "next/server";
import {
  AddTransactionButton,
  TransactionTable,
} from "@/components/transaction-table";
import { Card, CardContent } from "@/components/ui/card";
import { UrlSelect } from "@/components/url-select";
import { db } from "@/lib/db";
import { formatMonth, isMonthKey, monthKey } from "@/lib/format";

const ALL = "all";

const TYPE_OPTIONS = [
  { value: ALL, label: "All types" },
  { value: "INCOME", label: "Income" },
  { value: "EXPENSE", label: "Expense" },
];

// Every page reads the database at request time, so none can be prerendered.
export const instant = false;

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; month?: string }>;
}) {
  await connection();
  const params = await searchParams;

  const all = await db.transaction.findMany({
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
  });

  const type = TYPE_OPTIONS.some((o) => o.value === params.type)
    ? params.type!
    : ALL;
  const month = isMonthKey(params.month) ? params.month : ALL;
  const months = [...new Set(all.map((t) => monthKey(t.date)))];

  const transactions = all.filter(
    (t) =>
      (type === ALL || t.type === type) &&
      (month === ALL || monthKey(t.date) === month),
  );

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Transactions</h1>
        <AddTransactionButton />
      </div>

      <div className="flex flex-wrap gap-2">
        <UrlSelect param="type" label="Type" value={type} options={TYPE_OPTIONS} />
        <UrlSelect
          param="month"
          label="Month"
          value={month}
          options={[
            { value: ALL, label: "All months" },
            ...months.map((m) => ({ value: m, label: formatMonth(m) })),
          ]}
        />
      </div>

      <Card>
        <CardContent>
          {transactions.length > 0 ? (
            <TransactionTable transactions={transactions} />
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {all.length > 0
                ? "No transactions match these filters."
                : "No transactions yet. Add your first one to get started."}
            </p>
          )}
        </CardContent>
      </Card>
    </>
  );
}
