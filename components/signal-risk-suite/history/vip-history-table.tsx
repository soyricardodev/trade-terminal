import { cn, formatPct, formatUsdt } from "@/lib/utils"
import type {
  BacktestResult,
  DirectionFilter,
  OutcomeFilter,
  SignalOutcome,
} from "@/lib/vip-history/types"

interface VipHistoryTableProps {
  results: BacktestResult[]
  selectedId: number | null
  pairFilter: string | null
  directionFilter: DirectionFilter
  outcomeFilter: OutcomeFilter
  onSelect: (result: BacktestResult) => void
}

function outcomeTone(outcome: SignalOutcome): string {
  switch (outcome) {
    case "full_win":
    case "win":
    case "partial_win":
      return "text-long"
    case "loss":
      return "text-short"
    case "breakeven":
    case "not_executed":
    case "risk_filtered":
    case "timeout":
    case "inconclusive":
    case "no_data":
      return "text-muted-foreground"
    default: {
      const _exhaustive: never = outcome
      return _exhaustive
    }
  }
}

function outcomeLabel(outcome: SignalOutcome): string {
  switch (outcome) {
    case "not_executed":
      return "Not executed"
    case "risk_filtered":
      return "Risk filtered"
    case "loss":
      return "Loss"
    case "breakeven":
      return "Breakeven"
    case "win":
      return "Win"
    case "partial_win":
      return "Partial win"
    case "full_win":
      return "Full win"
    case "timeout":
      return "Timeout"
    case "inconclusive":
      return "Inconclusive"
    case "no_data":
      return "No data"
    default: {
      const _exhaustive: never = outcome
      return _exhaustive
    }
  }
}

export function VipHistoryTable({
  results,
  selectedId,
  pairFilter,
  directionFilter,
  outcomeFilter,
  onSelect,
}: VipHistoryTableProps) {
  const filtered = results.filter((result) => {
    if (pairFilter && result.signal.parsed.pair !== pairFilter) return false
    if (
      directionFilter !== "all" &&
      result.signal.parsed.direction !== directionFilter
    ) {
      return false
    }
    if (outcomeFilter !== "all" && result.outcome !== outcomeFilter) return false
    return true
  })

  if (filtered.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No signals match the current filters.
      </p>
    )
  }

  return (
    <div className="max-h-80 overflow-auto">
      <table className="w-full min-w-[40rem] text-left text-xs">
        <thead className="sticky top-0 bg-surface">
          <tr className="border-b border-border text-muted-foreground">
            <th className="px-2 py-2 font-medium">Date</th>
            <th className="px-2 py-2 font-medium">Pair</th>
            <th className="px-2 py-2 font-medium">Dir</th>
            <th className="px-2 py-2 font-medium">Outcome</th>
            <th className="px-2 py-2 font-medium">PnL</th>
            <th className="px-2 py-2 font-medium">ROI</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((result) => {
            const selected = selectedId === result.signal.id
            return (
              <tr
                key={result.signal.id}
                className={cn(
                  "cursor-pointer border-b border-border/60 transition-colors hover:bg-foreground/5",
                  selected && "bg-primary/10",
                )}
                onClick={() => onSelect(result)}
              >
                <td className="px-2 py-2 whitespace-nowrap">
                  {result.signal.date.slice(0, 16).replace("T", " ")}
                </td>
                <td className="px-2 py-2 font-mono">
                  {result.signal.parsed.pair}
                </td>
                <td
                  className={cn(
                    "px-2 py-2",
                    result.signal.parsed.direction === "LONG"
                      ? "text-long"
                      : "text-short",
                  )}
                >
                  {result.signal.parsed.direction}
                </td>
                <td className={cn("px-2 py-2", outcomeTone(result.outcome))}>
                  {outcomeLabel(result.outcome)}
                </td>
                <td
                  className={cn(
                    "px-2 py-2 tabular-nums",
                    outcomeTone(result.outcome),
                  )}
                >
                  {formatUsdt(result.totalPnlUsdt)}
                </td>
                <td className="px-2 py-2 tabular-nums">
                  {formatPct(result.totalRoiPct, 2)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
