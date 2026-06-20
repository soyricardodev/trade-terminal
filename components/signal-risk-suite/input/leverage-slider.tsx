"use client"

import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/field"
import { Slider } from "@/components/ui/slider"
import { cn, formatPct } from "@/lib/utils"

interface LeverageSliderProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  className?: string
}

export function LeverageSlider({
  value,
  onChange,
  min = 1,
  max = 125,
  className,
}: LeverageSliderProps) {
  return (
    <Field className={className}>
      <FieldContent>
        <div className="flex items-center justify-between gap-4">
          <FieldLabel>Leverage</FieldLabel>
          <span className="font-mono text-sm text-primary">{value}x</span>
        </div>
        <Slider
          min={min}
          max={max}
          step={1}
          value={[value]}
          onValueChange={(next) => {
            const resolved = Array.isArray(next) ? next[0] : next
            if (typeof resolved === "number") onChange(resolved)
          }}
        />
        <FieldDescription>
          Position notional scales with {formatPct(value * 100, 0)} effective
          exposure multiplier.
        </FieldDescription>
      </FieldContent>
    </Field>
  )
}
