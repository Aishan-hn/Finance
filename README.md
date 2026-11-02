# Finance Tracker

A local, single-user web app for tracking income, expenses and a stock portfolio. Net worth is your cash balance (income minus expenses) plus the market value of your holdings, using the latest prices from Yahoo Finance.

Built with Next.js, TypeScript, Tailwind CSS, shadcn/ui, Prisma with SQLite, Recharts and `yahoo-finance2`.

## Requirements

- Node.js 22 or later
- An internet connection for stock prices (no API key needed)

## Setup

1. Clone the repo and install dependencies:

   ```bash
   git clone https://github.com/Aishan-hn/Finance.git
   cd Finance
   npm install
   ```

2. Create a folder for the database. Keep it outside the project, and outside any synced folder such as OneDrive, because syncing a live SQLite file can corrupt it.

   ```powershell
   # Windows (PowerShell)
   New-Item -ItemType Directory -Force "$env:LOCALAPPDATA\FinanceTracker"
   ```

   ```bash
   # macOS / Linux
   mkdir -p ~/.local/share/finance-tracker
   ```

3. Create a file named `.env` in the project root with the absolute path to the database file. It's created in the next step.

   ```
   # Windows
   DATABASE_URL="file:C:/Users/YOUR_USERNAME/AppData/Local/FinanceTracker/dev.db"

   # macOS / Linux
   DATABASE_URL="file:/home/YOUR_USERNAME/.local/share/finance-tracker/dev.db"
   ```

   Keep only the line for your system, and replace `YOUR_USERNAME`. On macOS the home folder is `/Users/YOUR_USERNAME`.

4. Create the database and generate the Prisma client:

   ```bash
   npx prisma migrate deploy
   npx prisma generate
   ```

## Running the app

Start the development server:

```bash
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

To run a production build instead:

```bash
npm run build
npm start
```

## Good to know

- **Currency:** USD only. Tickers not priced in USD are rejected when you add them.
- **Stock purchases:** these don't reduce your cash balance unless you also log them as expenses.
- **Prices:** cached for 15 minutes. During market hours the latest price may not be a closing price.
- **Yahoo Finance:** `yahoo-finance2` is an unofficial client and can break or be rate-limited. A holding with no price is left out of the totals, and the app shows a warning.
- **Backups:** the database is a single file at the path in `.env`. Back it up yourself, because it isn't stored in Git.
