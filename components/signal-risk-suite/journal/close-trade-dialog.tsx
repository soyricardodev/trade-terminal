"use client"

import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Field,
  FieldContent,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { JournalEntry } from "@/lib/signal-risk/types"

interface CloseTradeDialogProps {
  entry: JournalEntry
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (actualExit: number, notes?: string) => void
}

export function CloseTradeDialog({
  entry,
  open,
  onOpenChange,
  onConfirm,
}: CloseTradeDialogProps) {
  const [actualExit, setActualExit] = useState("")
  const [notes, setNotes] = useState("")

  useEffect(() => {
    if (open) {
      setActualExit(String(entry.actualEntry))
      setNotes(entry.notes ?? "")
    }
  }, [open, entry.actualEntry, entry.notes])

  function handleSubmit() {
    const exit = Number.parseFloat(actualExit)
    if (!Number.isFinite(exit) || exit <= 0) return
    onConfirm(exit, notes)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Close {entry.setup.pair}</DialogTitle>
          <DialogDescription>
            Record the actual exit price. PnL uses your saved margin and
            leverage.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <Field>
            <FieldLabel htmlFor="actual-entry">Actual entry</FieldLabel>
            <FieldContent>
              <Input
                id="actual-entry"
                value={entry.actualEntry}
                readOnly
                disabled
              />
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel htmlFor="actual-exit">Actual exit</FieldLabel>
            <FieldContent>
              <Input
                id="actual-exit"
                type="number"
                step="any"
                value={actualExit}
                onChange={(event) => setActualExit(event.target.value)}
              />
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel htmlFor="close-notes">Notes</FieldLabel>
            <FieldContent>
              <Textarea
                id="close-notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Optional notes..."
              />
            </FieldContent>
          </Field>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit}>
            Confirm close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
