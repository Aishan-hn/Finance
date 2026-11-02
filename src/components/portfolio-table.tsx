"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  addStock,
  deleteStock,
  refreshPrices,
  updateStock,
} from "@/app/actions/stocks";
import { ConfirmDelete } from "@/components/confirm-delete";
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
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Holding } from "@/lib/finance";
import { formatDate, formatShares, formatUSD } from "@/lib/format";

function StockForm({
  holding,
  onDone,
}: {
  holding?: Holding;
  onDone: () => void;
}) {
  const [ticker, setTicker] = useState(holding?.ticker ?? "");
  const [shares, setShares] = useState(holding?.shares.toString() ?? "");
  const [pending, startTransition] = useTransition();

  function submit(event: FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      const result = holding
        ? await updateStock(holding.id, shares)
        : await addStock(ticker, shares);
      if (result.ok) {
        toast.success(holding ? "Shares updated" : "Stock added");
        onDone();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="stock-ticker">Ticker</Label>
        <Input
          id="stock-ticker"
          required
          maxLength={12}
          readOnly={!!holding}
          placeholder="AAPL"
          className="uppercase placeholder:normal-case"
          value={ticker}
          onChange={(e) => setTicker(e.target.value)}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="stock-shares">Shares</Label>
        <Input
          id="stock-shares"
          type="number"
          inputMode="decimal"
          min="0"
          step="any"
          required
          value={shares}
          onChange={(e) => setShares(e.target.value)}
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

function StockDialog({
  open,
  onOpenChange,
  holding,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  holding?: Holding;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{holding ? `Edit ${holding.ticker}` : "Add stock"}</DialogTitle>
        </DialogHeader>
        <StockForm holding={holding} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

export function PortfolioActions({ hasStocks }: { hasStocks: boolean }) {
  const [open, setOpen] = useState(false);
  const [refreshing, startRefresh] = useTransition();

  function refresh() {
    startRefresh(async () => {
      const result = await refreshPrices();
      if (result.ok) toast.success("Prices refreshed");
      else toast.error(result.error);
    });
  }

  return (
    <div className="flex gap-2">
      {hasStocks && (
        <Button variant="outline" onClick={refresh} disabled={refreshing}>
          <RefreshCw className={refreshing ? "animate-spin" : ""} aria-hidden />
          Refresh prices
        </Button>
      )}
      <Button onClick={() => setOpen(true)}>
        <Plus aria-hidden />
        Add stock
      </Button>
      <StockDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}

function formatChange(change: number | null) {
  if (change === null) return "—";
  return `${change >= 0 ? "+" : "−"}${formatUSD(Math.abs(change))}`;
}

export function PortfolioTable({
  holdings,
  total,
}: {
  holdings: Holding[];
  total: number;
}) {
  const [editing, setEditing] = useState<Holding>();
  const [editOpen, setEditOpen] = useState(false);
  const [deleting, setDeleting] = useState<Holding>();

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ticker</TableHead>
            <TableHead className="text-right">Shares</TableHead>
            <TableHead className="text-right">Last price</TableHead>
            <TableHead>Price date</TableHead>
            <TableHead className="text-right">Day change</TableHead>
            <TableHead className="text-right">Market value</TableHead>
            <TableHead className="text-right">Share of portfolio</TableHead>
            <TableHead className="w-20" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {holdings.map((h) => (
            <TableRow key={h.id}>
              <TableCell className="font-medium">{h.ticker}</TableCell>
              <TableCell className="text-right tabular-nums">
                {formatShares(h.shares)}
              </TableCell>
              {h.quote ? (
                <>
                  <TableCell className="text-right tabular-nums">
                    {formatUSD(h.quote.price)}
                  </TableCell>
                  <TableCell>
                    {formatDate(h.quote.priceDate)}
                    {h.quote.stale && (
                      <span className="text-muted-foreground"> (outdated)</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatChange(h.quote.change)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatUSD(h.value!)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {h.weight !== null ? `${(h.weight * 100).toFixed(1)}%` : "—"}
                  </TableCell>
                </>
              ) : (
                <TableCell colSpan={5} className="text-muted-foreground">
                  Price unavailable
                </TableCell>
              )}
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Edit ${h.ticker}`}
                  onClick={() => {
                    setEditing(h);
                    setEditOpen(true);
                  }}
                >
                  <Pencil aria-hidden />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Delete ${h.ticker}`}
                  onClick={() => setDeleting(h)}
                >
                  <Trash2 aria-hidden />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={5}>Total</TableCell>
            <TableCell className="text-right tabular-nums">
              {formatUSD(total)}
            </TableCell>
            <TableCell colSpan={2} />
          </TableRow>
        </TableFooter>
      </Table>
      <StockDialog
        key={editing?.id}
        open={editOpen}
        onOpenChange={setEditOpen}
        holding={editing}
      />
      <ConfirmDelete
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(undefined)}
        title={`Delete ${deleting?.ticker ?? "stock"}?`}
        description="This removes the holding from your portfolio. It can't be undone."
        onConfirm={() => deleteStock(deleting!.id)}
      />
    </>
  );
}
