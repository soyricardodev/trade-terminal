import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

export interface MetricStripItem {
  label: string
  value: ReactNode
  tone?: "long" | "short" | "gold" | "muted"
  sub?: string
}

interface MetricStripProps {
  items: MetricStripItem[]
  className?: string
}

const toneClasses = {
  long: "text-long",
  short: "text-short",
  gold: "text-primary",
  muted: "text-foreground",
} as const

export function MetricStrip({ items, className }: MetricStripProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-px border border-border bg-border sm:grid-cols-3 lg:grid-cols-5",
        className,
      )}
    >
      {items.map((item) => (
        <div
          key={item.label}
          className="flex min-w-0 flex-col gap-0.5 bg-surface px-3 py-2.5"
        >
          <span className="truncate text-xs text-muted-foreground">
            {item.label}
          </span>
          <span
            className={cn(
              "truncate font-mono text-base font-medium tabular-nums",
              item.tone ? toneClasses[item.tone] : "text-foreground",
            )}
          >
            {item.value}
          </span>
          {item.sub && (
            <span className="truncate text-xs text-muted-foreground">
              {item.sub}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}
