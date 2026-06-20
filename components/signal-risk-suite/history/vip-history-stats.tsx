import { MetricStrip } from "@/components/signal-risk-suite/ui/metric-strip"
import type { GlobalBacktestStats } from "@/lib/vip-history/types"
import { formatPct, formatUsdt } from "@/lib/utils"

interface VipHistoryStatsProps {
  stats: GlobalBacktestStats
}

export function VipHistoryStats({ stats }: VipHistoryStatsProps) {
  return (
    <MetricStrip
      items={[
        {
          label: "Win rate",
          value: stats.executed > 0 ? formatPct(stats.winRate, 1) : "—",
          tone: stats.winRate >= 50 ? "long" : "muted",
        },
        {
          label: "Total PnL",
          value: stats.executed > 0 ? formatUsdt(stats.totalPnlUsdt) : "—",
          tone:
            stats.totalPnlUsdt > 0
              ? "long"
              : stats.totalPnlUsdt < 0
                ? "short"
                : "muted",
        },
        {
          label: "Executed",
          value: `${stats.executed}/${stats.parsed}`,
          tone: "gold",
        },
        {
          label: "Avg ROI",
          value: stats.executed > 0 ? formatPct(stats.avgRoiPct, 2) : "—",
          tone: "muted",
        },
        {
          label: "TP1 hit",
          value: stats.executed > 0 ? formatPct(stats.tp1HitRate, 1) : "—",
          tone: "muted",
        },
        {
          label: "Timeouts",
          value: stats.timeouts + (stats.inconclusive ?? 0),
          tone: "muted",
        },
        {
          label: "Not executed",
          value: stats.notExecuted,
          tone: "muted",
        },
      ]}
    />
  )
}
