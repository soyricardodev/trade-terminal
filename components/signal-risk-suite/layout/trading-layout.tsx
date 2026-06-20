import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

interface TradingLayoutProps {
  chartArea: ReactNode
  orderPanel: ReactNode
  className?: string
}

export function TradingLayout({
  chartArea,
  orderPanel,
  className,
}: TradingLayoutProps) {
  return (
    <div
      className={cn(
        "grid min-w-0 grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-4",
        className,
      )}
    >
      <div className="min-w-0 overflow-hidden">{chartArea}</div>
      <div className="flex min-w-0 flex-col gap-3">{orderPanel}</div>
    </div>
  )
}
