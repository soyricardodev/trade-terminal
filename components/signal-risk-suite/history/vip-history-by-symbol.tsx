import type { SymbolBacktestStats } from "@/lib/vip-history/types"
import { cn, formatPct, formatUsdt } from "@/lib/utils"

interface VipHistoryBySymbolProps {
  stats: SymbolBacktestStats[]
  selectedSymbol: string | null
  onSelectSymbol: (symbol: string | null) => void
}

export function VipHistoryBySymbol({
  stats,
  selectedSymbol,
  onSelectSymbol,
}: VipHistoryBySymbolProps) {
  if (stats.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No symbol stats available.</p>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[32rem] text-left text-xs">
        <thead>
          <tr className="border-b border-border text-muted-foreground">
            <th className="px-2 py-2 font-medium">Pair</th>
            <th className="px-2 py-2 font-medium">Trades</th>
            <th className="px-2 py-2 font-medium">Win rate</th>
            <th className="px-2 py-2 font-medium">Total PnL</th>
            <th className="px-2 py-2 font-medium">Avg PnL</th>
          </tr>
        </thead>
        <tbody>
          {stats.map((row) => {
            const selected = selectedSymbol === row.symbol
            return (
              <tr
                key={row.symbol}
                className={cn(
                  "cursor-pointer border-b border-border/60 transition-colors hover:bg-foreground/5",
                  selected && "bg-primary/10",
                )}
                onClick={() =>
                  onSelectSymbol(selected ? null : row.symbol)
                }
              >
                <td className="px-2 py-2 font-mono">{row.symbol}</td>
                <td className="px-2 py-2 tabular-nums">{row.executed}</td>
                <td className="px-2 py-2 tabular-nums">
                  {row.executed > 0 ? formatPct(row.winRate, 1) : "—"}
                </td>
                <td
                  className={cn(
                    "px-2 py-2 tabular-nums",
                    row.totalPnlUsdt > 0
                      ? "text-long"
                      : row.totalPnlUsdt < 0
                        ? "text-short"
                        : "text-muted-foreground",
                  )}
                >
                  {formatUsdt(row.totalPnlUsdt)}
                </td>
                <td className="px-2 py-2 tabular-nums">
                  {formatUsdt(row.avgPnlUsdt)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
