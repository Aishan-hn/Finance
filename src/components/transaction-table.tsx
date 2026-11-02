"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { deleteTransaction } from "@/app/actions/transactions";
import { ConfirmDelete } from "@/components/confirm-delete";
import {
  TransactionDialog,
  type TransactionRow,
} from "@/components/transaction-dialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { signedAmount } from "@/lib/finance";
import { formatDate, formatUSD } from "@/lib/format";

export function AddTransactionButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus aria-hidden />
        Add transaction
      </Button>
      <TransactionDialog open={open} onOpenChange={setOpen} />
    </>
  );
}

export function TransactionTable({
  transactions,
  editable = true,
}: {
  transactions: TransactionRow[];
  editable?: boolean;
}) {
  const [editing, setEditing] = useState<TransactionRow>();
  const [editOpen, setEditOpen] = useState(false);
  const [deleting, setDeleting] = useState<TransactionRow>();

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Note</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            {editable && <TableHead className="w-20" />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((t) => {
            const amount = signedAmount(t);
            return (
              <TableRow key={t.id}>
                <TableCell>{formatDate(t.date)}</TableCell>
                <TableCell className="max-w-64 truncate font-medium">
                  {t.title ?? "—"}
                </TableCell>
                <TableCell>{t.category}</TableCell>
                <TableCell className="max-w-64 truncate text-muted-foreground">
                  {t.note}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {amount > 0 ? "+" : "−"}
                  {formatUSD(Math.abs(amount))}
                </TableCell>
                {editable && (
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Edit ${t.category} transaction`}
                      onClick={() => {
                        setEditing(t);
                        setEditOpen(true);
                      }}
                    >
                      <Pencil aria-hidden />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Delete ${t.category} transaction`}
                      onClick={() => setDeleting(t)}
                    >
                      <Trash2 aria-hidden />
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <TransactionDialog
        key={editing?.id}
        open={editOpen}
        onOpenChange={setEditOpen}
        transaction={editing}
      />
      <ConfirmDelete
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(undefined)}
        title="Delete this transaction?"
        description={
          deleting
            ? `${deleting.category}, ${formatUSD(deleting.amount)} on ${formatDate(deleting.date)}. This can't be undone.`
            : ""
        }
        onConfirm={() => deleteTransaction(deleting!.id)}
      />
    </>
  );
}
