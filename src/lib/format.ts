const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

// Transaction dates are calendar days stored as UTC midnight, so they are
// always read and displayed in UTC to stop them shifting by a day.
const day = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeZone: "UTC",
});

const month = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export function formatUSD(value: number) {
  return usd.format(value);
}

export function formatDate(date: Date) {
  return day.format(date);
}

export function formatMonth(key: string) {
  return month.format(new Date(`${key}-01T00:00:00Z`));
}

export function formatShares(value: number) {
  return value.toLocaleString("en-US", { maximumFractionDigits: 6 });
}

export function monthKey(date: Date) {
  return date.toISOString().slice(0, 7);
}

export function toDateInput(date: Date) {
  return date.toISOString().slice(0, 10);
}

/** Today's calendar date in the machine's time zone, as YYYY-MM-DD. */
export function todayInput() {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${mm}-${dd}`;
}

export function currentMonthKey() {
  return todayInput().slice(0, 7);
}

export function isMonthKey(value: string | undefined): value is string {
  return !!value && /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}
