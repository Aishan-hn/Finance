import { connection } from "next/server";
import { TriangleAlert } from "lucide-react";
import { PortfolioActions, PortfolioTable } from "@/components/portfolio-table";
import { Card, CardContent } from "@/components/ui/card";
import { db } from "@/lib/db";
import { buildHoldings } from "@/lib/finance";
import { getQuotes } from "@/lib/prices";

// Every page reads the database at request time, so none can be prerendered.
export const instant = false;

export default async function PortfolioPage() {
  await connection();

  const stocks = await db.stock.findMany({ orderBy: { ticker: "asc" } });
  const quotes = await getQuotes(stocks.map((s) => s.ticker));
  const { holdings, total, missing } = buildHoldings(stocks, quotes);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Portfolio</h1>
        <PortfolioActions hasStocks={stocks.length > 0} />
      </div>

      {missing.length > 0 && (
        <p
          role="alert"
          className="flex items-center gap-2 rounded-lg border bg-background p-3 text-sm"
        >
          <TriangleAlert className="size-4 shrink-0" aria-hidden />
          The total excludes {missing.join(", ")} because no price is available.
        </p>
      )}

      <Card>
        <CardContent>
          {stocks.length > 0 ? (
            <PortfolioTable holdings={holdings} total={total} />
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No stocks yet. Add your first holding to track its value.
            </p>
          )}
        </CardContent>
      </Card>
    </>
  );
}
