"use client"

import { IconMinus, IconPlus } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const PRESETS = [5, 10, 20, 50, 75, 100, 125] as const

interface LeverageSelectorProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  className?: string
}

export function LeverageSelector({
  value,
  onChange,
  min = 1,
  max = 125,
  className,
}: LeverageSelectorProps) {
  function clamp(next: number) {
    return Math.min(max, Math.max(min, Math.round(next)))
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">Leverage</span>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon-xs"
            aria-label="Decrease leverage"
            onClick={() => onChange(clamp(value - 1))}
            disabled={value <= min}
          >
            <IconMinus className="size-3" />
          </Button>
          <span className="min-w-[3rem] text-center font-mono text-base font-semibold text-primary tabular-nums">
            {value}x
          </span>
          <Button
            type="button"
            variant="outline"
            size="icon-xs"
            aria-label="Increase leverage"
            onClick={() => onChange(clamp(value + 1))}
            disabled={value >= max}
          >
            <IconPlus className="size-3" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-1 sm:grid-cols-7">
        {PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => onChange(preset)}
            className={cn(
              "px-1 py-1.5 font-mono text-xs transition-colors",
              value === preset
                ? "bg-primary text-primary-foreground"
                : "bg-elevated text-muted-foreground hover:bg-foreground/10 hover:text-foreground",
            )}
          >
            {preset}x
          </button>
        ))}
      </div>
    </div>
  )
}
