"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { checkTicker, getQuotes, type TickerCheck } from "@/lib/prices";
import {
  sharesSchema,
  tickerSchema,
  type ActionResult,
} from "@/lib/validation";

const TICKER_ERRORS: Record<Exclude<TickerCheck, "ok">, string> = {
  "not-found": "Yahoo Finance doesn't recognize that ticker.",
  "not-usd": "Only tickers priced in USD are supported.",
  unavailable: "Couldn't reach Yahoo Finance to check that ticker. Try again.",
};

export async function addStock(
  rawTicker: string,
  rawShares: string,
): Promise<ActionResult> {
  const ticker = tickerSchema.safeParse(rawTicker);
  if (!ticker.success) {
    return { ok: false, error: ticker.error.issues[0].message };
  }
  const shares = sharesSchema.safeParse(rawShares);
  if (!shares.success) {
    return { ok: false, error: shares.error.issues[0].message };
  }

  const duplicate = `${ticker.data} is already in your portfolio. Edit its shares instead.`;
  const existing = await db.stock.findUnique({ where: { ticker: ticker.data } });
  if (existing) return { ok: false, error: duplicate };

  const check = await checkTicker(ticker.data);
  if (check !== "ok") return { ok: false, error: TICKER_ERRORS[check] };

  try {
    await db.stock.create({
      data: { ticker: ticker.data, shares: shares.data },
    });
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") {
      return { ok: false, error: duplicate };
    }
    throw error;
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function updateStock(
  id: string,
  rawShares: string,
): Promise<ActionResult> {
  const shares = sharesSchema.safeParse(rawShares);
  if (!shares.success) {
    return { ok: false, error: shares.error.issues[0].message };
  }
  await db.stock.update({ where: { id }, data: { shares: shares.data } });
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteStock(id: string): Promise<ActionResult> {
  await db.stock.delete({ where: { id } });
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function refreshPrices(): Promise<ActionResult> {
  const stocks = await db.stock.findMany();
  const quotes = await getQuotes(
    stocks.map((s) => s.ticker),
    { force: true },
  );
  revalidatePath("/", "layout");
  const updated = [...quotes.values()].filter((q) => !q.stale).length;
  if (updated < stocks.length) {
    return {
      ok: false,
      error: `Updated ${updated} of ${stocks.length} prices.`,
    };
  }
  return { ok: true };
}
