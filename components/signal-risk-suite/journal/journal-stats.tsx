import { MetricStrip } from "@/components/signal-risk-suite/ui/metric-strip"
import type { JournalStats } from "@/lib/signal-risk/types"
import { formatPct, formatUsdt } from "@/lib/utils"

interface JournalStatsProps {
  stats: JournalStats
  className?: string
}

export function JournalStatsPanel({ stats, className }: JournalStatsProps) {
  return (
    <MetricStrip
      className={className}
      items={[
        { label: "Total", value: stats.totalTrades, tone: "muted" },
        { label: "Open", value: stats.openTrades, tone: "gold" },
        {
          label: "Win rate",
          value: stats.closedTrades > 0 ? formatPct(stats.winRate, 1) : "—",
          tone: "muted",
        },
        {
          label: "Total PnL",
          value:
            stats.closedTrades > 0 ? formatUsdt(stats.totalPnlUsdt) : "—",
          tone:
            stats.totalPnlUsdt > 0
              ? "long"
              : stats.totalPnlUsdt < 0
                ? "short"
                : "muted",
        },
      ]}
    />
  )
}
