"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  transactionSchema,
  type ActionResult,
  type TransactionInput,
} from "@/lib/validation";

function toData(input: TransactionInput) {
  const parsed = transactionSchema.safeParse(input);
  if (!parsed.success) {
    return { data: null, error: parsed.error.issues[0].message };
  }
  const { date, note, ...rest } = parsed.data;
  return {
    data: { ...rest, date: new Date(`${date}T00:00:00Z`), note: note || null },
    error: null,
  };
}

export async function createTransaction(
  input: TransactionInput,
): Promise<ActionResult> {
  const { data, error } = toData(input);
  if (!data) return { ok: false, error };
  await db.transaction.create({ data });
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function updateTransaction(
  id: string,
  input: TransactionInput,
): Promise<ActionResult> {
  const { data, error } = toData(input);
  if (!data) return { ok: false, error };
  await db.transaction.update({ where: { id }, data });
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteTransaction(id: string): Promise<ActionResult> {
  await db.transaction.delete({ where: { id } });
  revalidatePath("/", "layout");
  return { ok: true };
}
