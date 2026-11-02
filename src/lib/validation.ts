import { z } from "zod";

export type ActionResult = { ok: true } | { ok: false; error: string };

const positiveNumber = (label: string) =>
  z.coerce
    .number({ error: `${label} must be a number` })
    .positive(`${label} must be greater than 0`)
    .max(1e12, `${label} is too large`);

export const transactionSchema = z.object({
  type: z.enum(["INCOME", "EXPENSE"]),
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(100, "Title is too long"),
  amount: positiveNumber("Amount"),
  category: z
    .string()
    .trim()
    .min(1, "Category is required")
    .max(50, "Category is too long"),
  date: z.iso.date("Enter a valid date"),
  note: z.string().trim().max(500, "Note is too long").optional(),
});

export type TransactionInput = z.input<typeof transactionSchema>;

export const sharesSchema = positiveNumber("Shares");

export const tickerSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9.\-]{1,12}$/, "Enter a valid ticker symbol");
