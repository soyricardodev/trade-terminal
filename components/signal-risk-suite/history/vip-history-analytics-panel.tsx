"use client"

import type { VipHistoryAnalytics } from "@/lib/vip-history/analytics"
import { formatPct, formatUsdt } from "@/lib/utils"

interface VipHistoryAnalyticsPanelProps {
  analytics: VipHistoryAnalytics
}

export function VipHistoryAnalyticsPanel({
  analytics,
}: VipHistoryAnalyticsPanelProps) {
  const { byDirection, slDistanceBuckets, timeToTp1 } = analytics

  return (
    <div className="grid gap-3 lg:grid-cols-3">
      <section className="border border-border/60 p-3">
        <p className="mb-2 text-xs font-medium">LONG vs SHORT</p>
        <div className="space-y-2 text-xs">
          {byDirection.map((row) => (
            <div
              key={row.direction}
              className="flex items-center justify-between border-b border-border/40 pb-1"
            >
              <span className={row.direction === "LONG" ? "text-long" : "text-short"}>
                {row.direction}
              </span>
              <span className="font-mono tabular-nums">
                {row.executed} trades · {formatPct(row.winRate, 0)} · {formatUsdt(row.totalPnlUsdt)}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="border border-border/60 p-3">
        <p className="mb-2 text-xs font-medium">SL distance vs outcome</p>
        <div className="space-y-1 text-xs">
          {slDistanceBuckets
            .filter((bucket) => bucket.count > 0)
            .map((bucket) => (
              <div
                key={bucket.label}
                className="flex items-center justify-between border-b border-border/40 pb-1"
              >
                <span>{bucket.label}</span>
                <span className="font-mono tabular-nums">
                  n={bucket.count} · {formatPct(bucket.winRate, 0)} · {formatUsdt(bucket.avgPnlUsdt)}
                </span>
              </div>
            ))}
        </div>
      </section>

      <section className="border border-border/60 p-3">
        <p className="mb-2 text-xs font-medium">Time to TP1</p>
        {timeToTp1.samples === 0 ? (
          <p className="text-xs text-muted-foreground">No TP1 hits in sample.</p>
        ) : (
          <div className="space-y-1 text-xs text-muted-foreground">
            <p>
              Avg {Math.round(timeToTp1.avgMinutes)} min · Median{" "}
              {Math.round(timeToTp1.medianMinutes)} min
            </p>
            <p>
              Under 1h: {timeToTp1.under1h}/{timeToTp1.samples}
            </p>
            <p>
              Under 4h: {timeToTp1.under4h}/{timeToTp1.samples}
            </p>
            <p>
              Over 12h: {timeToTp1.over12h}/{timeToTp1.samples}
            </p>
          </div>
        )}
      </section>
    </div>
  )
}
