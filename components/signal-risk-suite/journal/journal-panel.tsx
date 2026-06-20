"use client"

import { IconDownload, IconUpload } from "@tabler/icons-react"
import { useRef } from "react"
import { toast } from "sonner"

import { JournalStatsPanel } from "@/components/signal-risk-suite/journal/journal-stats"
import { TradeCard } from "@/components/signal-risk-suite/journal/trade-card"
import { PanelSection } from "@/components/signal-risk-suite/ui/panel-section"
import { Button } from "@/components/ui/button"
import type { JournalEntry } from "@/lib/signal-risk/types"
import type { JournalStats } from "@/lib/signal-risk/types"

interface JournalPanelProps {
  entries: JournalEntry[]
  stats: JournalStats
  hydrated: boolean
  onCloseTrade: (id: string, actualExit: number, notes?: string) => void
  onDeleteTrade: (id: string) => void
  onExport: () => string
  onImport: (raw: string) => void
}

export function JournalPanel({
  entries,
  stats,
  hydrated,
  onCloseTrade,
  onDeleteTrade,
  onExport,
  onImport,
}: JournalPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleExport() {
    const json = onExport()
    const blob = new Blob([json], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = `trade-terminal-journal-${Date.now()}.json`
    anchor.click()
    URL.revokeObjectURL(url)
    toast.success("Journal exported")
  }

  function handleImportClick() {
    fileInputRef.current?.click()
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      try {
        onImport(String(reader.result))
        toast.success("Journal imported")
      } catch {
        toast.error("Invalid journal file")
      }
    }
    reader.readAsText(file)
    event.target.value = ""
  }

  return (
    <div className="flex flex-col gap-3">
      <PanelSection
        title="Trade journal"
        description="Open trades, close with a single exit, track win rate locally."
        action={
          <div className="flex shrink-0 gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={handleExport}
              aria-label="Export journal"
            >
              <IconDownload className="size-4" aria-hidden />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={handleImportClick}
              aria-label="Import journal"
            >
              <IconUpload className="size-4" aria-hidden />
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        }
      >
        <JournalStatsPanel stats={stats} />
      </PanelSection>

      {!hydrated ? (
        <PanelSection>
          <p className="py-6 text-center text-sm text-muted-foreground">
            Loading journal…
          </p>
        </PanelSection>
      ) : entries.length === 0 ? (
        <PanelSection title="No trades yet">
          <p className="text-sm text-muted-foreground">
            Register a trade from the Analyze tab to start tracking results.
          </p>
        </PanelSection>
      ) : (
        <div className="flex flex-col gap-2">
          {entries.map((entry) => (
            <TradeCard
              key={entry.id}
              entry={entry}
              onClose={onCloseTrade}
              onDelete={onDeleteTrade}
            />
          ))}
        </div>
      )}
    </div>
  )
}
