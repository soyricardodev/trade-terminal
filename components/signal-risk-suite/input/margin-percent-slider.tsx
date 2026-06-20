"use client"

import { Slider } from "@/components/ui/slider"
import { cn, formatUsdt } from "@/lib/utils"

const PRESETS = [25, 50, 75, 100] as const

interface MarginPercentSliderProps {
  availableBalanceUsdt: number
  marginUsdt: number
  onMarginChange: (marginUsdt: number) => void
  className?: string
}

export function MarginPercentSlider({
  availableBalanceUsdt,
  marginUsdt,
  onMarginChange,
  className,
}: MarginPercentSliderProps) {
  const percent =
    availableBalanceUsdt > 0
      ? Math.min(100, Math.max(0, (marginUsdt / availableBalanceUsdt) * 100))
      : 0

  function setPercent(nextPercent: number) {
    const clamped = Math.min(100, Math.max(0, nextPercent))
    const nextMargin = (availableBalanceUsdt * clamped) / 100
    onMarginChange(Number(nextMargin.toFixed(2)))
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="grid grid-cols-4 gap-1.5">
        {PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => setPercent(preset)}
            className={cn(
              "py-2 text-center font-mono text-xs font-medium transition-colors",
              Math.round(percent) === preset
                ? "bg-primary text-primary-foreground"
                : "bg-elevated text-muted-foreground hover:bg-foreground/10 hover:text-foreground",
            )}
          >
            {preset}%
          </button>
        ))}
      </div>

      <Slider
        min={0}
        max={100}
        step={1}
        value={[percent]}
        onValueChange={(next) => {
          const resolved = Array.isArray(next) ? next[0] : next
          if (typeof resolved === "number") setPercent(resolved)
        }}
      />

      <p className="text-center text-xs text-muted-foreground">
        Using{" "}
        <span className="font-mono text-foreground tabular-nums">
          {percent.toFixed(0)}%
        </span>{" "}
        of {formatUsdt(availableBalanceUsdt)} available
      </p>
    </div>
  )
}
