import YahooFinance from "yahoo-finance2";
import type { Quote } from "@/lib/finance";

const CACHE_TTL_MS = 15 * 60 * 1000;
const FETCH_TIMEOUT_MS = 8000;

const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

type CacheEntry = { quote: Quote; fetchedAt: number };

const globalForPrices = globalThis as unknown as {
  priceCache?: Map<string, CacheEntry>;
};
const cache = (globalForPrices.priceCache ??= new Map<string, CacheEntry>());

type YahooQuote = Awaited<ReturnType<typeof fetchYahoo>>[number];

async function fetchYahoo(tickers: string[]) {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new Error("Yahoo Finance request timed out")),
      FETCH_TIMEOUT_MS,
    );
  });
  try {
    return await Promise.race([yahooFinance.quote(tickers), timeout]);
  } finally {
    clearTimeout(timer);
  }
}

function toQuote(result: YahooQuote): Quote | null {
  const price = result.regularMarketPrice ?? result.regularMarketPreviousClose;
  if (price === undefined) return null;
  return {
    ticker: result.symbol,
    price,
    change: result.regularMarketChange ?? null,
    priceDate: result.regularMarketTime ?? new Date(),
    stale: false,
  };
}

/**
 * Latest prices for the given tickers. A ticker that can't be priced is absent
 * from the result, unless an older cached value exists to fall back on.
 */
export async function getQuotes(
  tickers: string[],
  { force = false }: { force?: boolean } = {},
) {
  const now = Date.now();
  const quotes = new Map<string, Quote>();
  const toFetch: string[] = [];

  for (const ticker of tickers) {
    const entry = cache.get(ticker);
    if (!force && entry && now - entry.fetchedAt < CACHE_TTL_MS) {
      quotes.set(ticker, entry.quote);
    } else {
      toFetch.push(ticker);
    }
  }

  if (toFetch.length > 0) {
    try {
      for (const result of await fetchYahoo(toFetch)) {
        const quote = toQuote(result);
        if (!quote) continue;
        cache.set(quote.ticker, { quote, fetchedAt: now });
        quotes.set(quote.ticker, quote);
      }
    } catch (error) {
      console.error("Failed to fetch quotes", error);
    }
    for (const ticker of toFetch) {
      const entry = cache.get(ticker);
      if (!quotes.has(ticker) && entry) {
        quotes.set(ticker, { ...entry.quote, stale: true });
      }
    }
  }

  return quotes;
}

export type TickerCheck = "ok" | "not-found" | "not-usd" | "unavailable";

export async function checkTicker(ticker: string): Promise<TickerCheck> {
  try {
    const [result] = await fetchYahoo([ticker]);
    if (!result || !toQuote(result)) return "not-found";
    if (result.currency !== "USD") return "not-usd";
    return "ok";
  } catch (error) {
    console.error(`Failed to check ticker ${ticker}`, error);
    return "unavailable";
  }
}
