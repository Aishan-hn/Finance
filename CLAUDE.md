# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

A local, single-user Next.js app for tracking income, expenses and a stock portfolio. `README.md` covers first-time setup.

**Next.js 16 differs from what you may remember.** As `AGENTS.md` says, read the relevant guide in `node_modules/next/dist/docs/` before writing Next.js code. `next dev` re-adds its block to `AGENTS.md`, so commit that change rather than reverting it.

## Commands

```bash
npm run dev                # dev server at http://localhost:3000
npm run build              # production build
npm run lint               # ESLint
npx tsc --noEmit           # type-check

# After editing prisma/schema.prisma
npx prisma migrate dev --name <change>
npx prisma generate
```

There is no test framework or test suite.

The Prisma client is generated into `src/generated/prisma`, which is gitignored and has no postinstall hook. If imports from `@/generated/prisma/client` fail, run `npx prisma generate`.

`DATABASE_URL` in `.env` points at the user's real financial data, so migrations run against it. It is an absolute path outside the repo, deliberately outside OneDrive because syncing a live SQLite file can corrupt it. The database file isn't in Git, so copy it before migrating. Never run `prisma migrate reset` or accept a reset prompt from `prisma migrate dev`, because a reset deletes that data.

`prisma.config.ts` calls `process.loadEnvFile()`, so Prisma commands, including `prisma generate`, fail if `.env` doesn't exist.

## Architecture

**Data flow.** Pages in `src/app` are async server components that read through Prisma (`src/lib/db.ts`) and pass plain data to client components in `src/components`. Mutations go through server actions in `src/app/actions`, which validate with the zod schemas in `src/lib/validation.ts`, return an `ActionResult` (`{ ok: true } | { ok: false; error }`) for expected failures, and call `revalidatePath("/", "layout")` so every page refreshes.

**Rendering.** `next.config.ts` enables `cacheComponents`, so each page that reads the database calls `await connection()` and exports `instant = false`. New data-reading pages need both.

**Filters** live in the URL as search params, set through `UrlSelect`. Pages parse and validate them on the server, falling back to a default for bad values.

**Domain logic** in `src/lib/finance.ts` is pure and takes data as arguments. Keep database and network access out of it.

**Prices** (`src/lib/prices.ts`) wrap `yahoo-finance2` with an 8-second timeout and a 15-minute in-memory cache stored on `globalThis` to survive hot reloads. `getQuotes` with `force: true` skips the fresh-cache check, which is how the `refreshPrices` action works. Failed fetches fall back to cached quotes marked `stale`. A ticker with no quote at all is missing from the result, so `buildHoldings` gives it a null value and returns it in `missing`. Callers must show that as a partial total, never as $0.

**Prisma 7** uses the `better-sqlite3` driver adapter. The database URL comes from `prisma.config.ts` and the `db.ts` adapter, not from `schema.prisma`.

**UI.** `src/components/ui` holds shadcn components (`base-nova` style, built on `@base-ui/react`, not Radix). Dark mode uses `next-themes`, which sets a `dark` class on `<html>`. The theme is unknown during server rendering, so anything that changes with the theme should use `dark:` CSS variants, not `resolvedTheme`, to avoid a hydration mismatch.

## Conventions and decisions

- Net worth is `(income - expenses) + market value of holdings`. Stock purchases don't reduce cash unless also logged as expenses. Get the user's agreement before changing this or moving the database.
- USD only. `addStock` rejects tickers not priced in USD.
- Prisma stays on 7.x, because npm's `latest` tag pointed to an 8.0 release candidate when the app was built.
- Transaction dates are calendar days stored as UTC midnight. Read and format them in UTC using the helpers in `src/lib/format.ts`. Only "today" (`todayInput`, `currentMonthKey`) uses the machine's time zone.
- `Transaction.type` is a plain string (`"INCOME"` or `"EXPENSE"`), because the enum is enforced by zod rather than the schema. Categories are free-form strings in the database. `src/lib/categories.ts` only lists the ones offered in the UI.
