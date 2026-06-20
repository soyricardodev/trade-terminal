"use client"

import { useState } from "react"

import { CloseTradeDialog } from "@/components/signal-risk-suite/journal/close-trade-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { JournalEntry } from "@/lib/signal-risk/types"
import { cn, formatPrice, formatUsdt } from "@/lib/utils"

interface TradeCardProps {
  entry: JournalEntry
  onClose: (id: string, actualExit: number, notes?: string) => void
  onDelete: (id: string) => void
}

function statusBadgeClass(status: JournalEntry["status"]) {
  switch (status) {
    case "win":
      return "border-long/40 text-long"
    case "loss":
      return "border-short/40 text-short"
    case "breakeven":
      return "border-warning/40 text-warning"
    case "open":
      return "border-primary/40 text-primary"
    default: {
      const _exhaustive: never = status
      return _exhaustive
    }
  }
}

export function TradeCard({ entry, onClose, onDelete }: TradeCardProps) {
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <>
      <article className="border border-border bg-surface">
        <header className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
            <span className="truncate text-sm font-medium">{entry.setup.pair}</span>
            <Badge
              variant="outline"
              className={cn(
                "text-xs",
                entry.setup.direction === "LONG"
                  ? "border-long/40 text-long"
                  : "border-short/40 text-short",
              )}
            >
              {entry.setup.direction}
            </Badge>
            <Badge variant="outline" className={cn("text-xs", statusBadgeClass(entry.status))}>
              {entry.status}
            </Badge>
          </div>
          <time className="shrink-0 text-xs text-muted-foreground">
            {new Date(entry.createdAt).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </time>
        </header>

        <div className="grid grid-cols-2 gap-x-4 gap-y-2 px-3 py-2.5 text-xs">
          <div>
            <span className="text-muted-foreground">Plan entry </span>
            <span className="font-mono tabular-nums">{formatPrice(entry.setup.entry)}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Actual entry </span>
            <span className="font-mono tabular-nums">{formatPrice(entry.actualEntry)}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Max loss </span>
            <span className="font-mono tabular-nums text-short">
              {formatUsdt(-entry.analysis.maxLossUsdt)}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Max gain </span>
            <span className="font-mono tabular-nums text-long">
              {formatUsdt(entry.analysis.maxGainUsdt)}
            </span>
          </div>
          {entry.actualExit !== undefined && entry.pnlUsdt !== undefined && (
            <>
              <div>
                <span className="text-muted-foreground">Exit </span>
                <span className="font-mono tabular-nums">{formatPrice(entry.actualExit)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Realized </span>
                <span
                  className={cn(
                    "font-mono tabular-nums",
                    entry.pnlUsdt >= 0 ? "text-long" : "text-short",
                  )}
                >
                  {formatUsdt(entry.pnlUsdt)}
                </span>
              </div>
            </>
          )}
        </div>

        {entry.notes && (
          <p className="border-t border-border px-3 py-2 text-xs text-muted-foreground">
            {entry.notes}
          </p>
        )}

        <footer className="flex gap-2 border-t border-border px-3 py-2">
          {entry.status === "open" && (
            <Button type="button" size="xs" onClick={() => setDialogOpen(true)}>
              Close trade
            </Button>
          )}
          <Button
            type="button"
            size="xs"
            variant="ghost"
            className="text-muted-foreground"
            onClick={() => onDelete(entry.id)}
          >
            Delete
          </Button>
        </footer>
      </article>

      <CloseTradeDialog
        entry={entry}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onConfirm={(actualExit, notes) => {
          onClose(entry.id, actualExit, notes)
          setDialogOpen(false)
        }}
      />
    </>
  )
}
