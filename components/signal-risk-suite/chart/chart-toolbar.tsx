"use client"

import { cn, formatPrice } from "@/lib/utils"
import type { ChartInterval } from "@/lib/market/types"
import { CHART_INTERVALS } from "@/lib/market/types"

interface ChartToolbarProps {
  interval: ChartInterval
  onIntervalChange: (interval: ChartInterval) => void
  intervals?: ChartInterval[]
  lastPrice: number | null
  isLive: boolean
  streamStatus?: "idle" | "loading" | "ready" | "streaming" | "fallback" | "error"
  isFallback?: boolean
  className?: string
}

function statusLabel(
  isFallback: boolean,
  isLive: boolean,
  streamStatus?: ChartToolbarProps["streamStatus"],
): string {
  if (isFallback) return "Offline"
  if (isLive || streamStatus === "streaming") return "Live"
  if (streamStatus === "loading") return "Loading"
  if (streamStatus === "ready") return "Historical"
  return "Delayed"
}

export function ChartToolbar({
  interval,
  onIntervalChange,
  intervals = CHART_INTERVALS,
  lastPrice,
  isLive,
  streamStatus,
  isFallback = false,
  className,
}: ChartToolbarProps) {
  const label = statusLabel(isFallback, isLive, streamStatus)
  const live = !isFallback && (isLive || streamStatus === "streaming")

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2",
        className,
      )}
    >
      <div className="flex items-center gap-1">
        {intervals.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => onIntervalChange(value)}
            className={cn(
              "min-w-[2.5rem] px-2.5 py-1.5 font-mono text-xs font-medium transition-colors",
              interval === value
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground",
            )}
          >
            {value}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        {isFallback && (
          <span className="text-xs text-warning">Synthetic preview</span>
        )}
        <span
          className={cn(
            "rounded-none px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide",
            live
              ? "bg-long/15 text-long"
              : isFallback
                ? "bg-warning/15 text-warning"
                : "bg-muted text-muted-foreground",
          )}
        >
          {label}
        </span>
        {lastPrice !== null && (
          <span className="font-mono text-sm font-medium tabular-nums">
            {formatPrice(lastPrice)}
          </span>
        )}
      </div>
    </div>
  )
}
