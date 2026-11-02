"use client";

import { useState, useTransition, type FormEvent } from "react";
import { toast } from "sonner";
import {
  createTransaction,
  updateTransaction,
} from "@/app/actions/transactions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/lib/categories";
import { toDateInput, todayInput } from "@/lib/format";

export type TransactionRow = {
  id: string;
  type: string;
  amount: number;
  category: string;
  date: Date;
  note: string | null;
};

const CUSTOM = "__custom__";

const TYPE_OPTIONS = [
  { value: "EXPENSE", label: "Expense" },
  { value: "INCOME", label: "Income" },
];

const categoriesFor = (type: string) =>
  type === "INCOME" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

function TransactionForm({
  transaction,
  onDone,
}: {
  transaction?: TransactionRow;
  onDone: () => void;
}) {
  const [type, setType] = useState(transaction?.type ?? "EXPENSE");
  const [amount, setAmount] = useState(transaction?.amount.toString() ?? "");
  const [date, setDate] = useState(
    transaction ? toDateInput(transaction.date) : todayInput(),
  );
  const [note, setNote] = useState(transaction?.note ?? "");
  const [category, setCategory] = useState(transaction?.category ?? "");
  const [custom, setCustom] = useState(
    !!transaction && !categoriesFor(transaction.type).includes(transaction.category),
  );
  const [pending, startTransition] = useTransition();

  const categoryOptions = [
    ...categoriesFor(type).map((c) => ({ value: c, label: c })),
    { value: CUSTOM, label: "Custom…" },
  ];

  function onTypeChange(next: string | null) {
    if (next === null) return;
    setType(next);
    if (!custom && !categoriesFor(next).includes(category)) setCategory("");
  }

  function onCategoryChange(next: string | null) {
    if (next === null) return;
    setCustom(next === CUSTOM);
    setCategory(next === CUSTOM ? "" : next);
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      const input = { type, amount, category, date, note } as Parameters<
        typeof createTransaction
      >[0];
      const result = transaction
        ? await updateTransaction(transaction.id, input)
        : await createTransaction(input);
      if (result.ok) {
        toast.success(transaction ? "Transaction updated" : "Transaction added");
        onDone();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="tx-type">Type</Label>
          <Select value={type} onValueChange={onTypeChange} items={TYPE_OPTIONS}>
            <SelectTrigger id="tx-type" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TYPE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="tx-amount">Amount (USD)</Label>
          <Input
            id="tx-amount"
            type="number"
            inputMode="decimal"
            min="0.01"
            step="0.01"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="tx-category">Category</Label>
          <Select
            value={custom ? CUSTOM : category || null}
            onValueChange={onCategoryChange}
            items={categoryOptions}
          >
            <SelectTrigger id="tx-category" className="w-full">
              <SelectValue placeholder="Choose" />
            </SelectTrigger>
            <SelectContent>
              {categoryOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="tx-date">Date</Label>
          <Input
            id="tx-date"
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
      </div>
      {custom && (
        <div className="grid gap-2">
          <Label htmlFor="tx-custom">Custom category</Label>
          <Input
            id="tx-custom"
            required
            maxLength={50}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
        </div>
      )}
      <div className="grid gap-2">
        <Label htmlFor="tx-note">Note (optional)</Label>
        <Input
          id="tx-note"
          maxLength={500}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>
      <DialogFooter>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function TransactionDialog({
  open,
  onOpenChange,
  transaction,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction?: TransactionRow;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {transaction ? "Edit transaction" : "Add transaction"}
          </DialogTitle>
        </DialogHeader>
        <TransactionForm
          transaction={transaction}
          onDone={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
