import { cn, formatPrice } from "@/lib/utils"

export interface PriceLevel {
  label: string
  price: number
  tone: "gold" | "short" | "long"
  opacity?: number
}

interface PriceLadderProps {
  levels: PriceLevel[]
  className?: string
  compact?: boolean
}

const toneClasses = {
  gold: "text-primary",
  short: "text-short",
  long: "text-long",
} as const

export function PriceLadder({ levels, className, compact }: PriceLadderProps) {
  const sorted = [...levels].sort((a, b) => b.price - a.price)

  if (compact) {
    return (
      <ul
        className={cn(
          "grid grid-cols-2 gap-x-3 gap-y-1 border-t border-border bg-void px-3 py-2 text-xs sm:grid-cols-3",
          className,
        )}
      >
        {sorted.map((level) => (
          <li key={level.label} className="flex items-center gap-1.5">
            <span
              className={cn("font-medium", toneClasses[level.tone])}
              style={level.opacity ? { opacity: level.opacity } : undefined}
            >
              {level.label}
            </span>
            <span className="font-mono tabular-nums text-foreground">
              {formatPrice(level.price)}
            </span>
          </li>
        ))}
      </ul>
    )
  }

  return (
    <div
      className={cn(
        "flex w-20 shrink-0 flex-col justify-between border-l border-border bg-surface py-2 text-xs",
        className,
      )}
    >
      {sorted.map((level) => (
        <div
          key={level.label}
          className="flex flex-col items-end px-2 leading-tight"
          style={level.opacity ? { opacity: level.opacity } : undefined}
        >
          <span className={cn("font-medium", toneClasses[level.tone])}>
            {level.label}
          </span>
          <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
            {formatPrice(level.price)}
          </span>
        </div>
      ))}
    </div>
  )
}

export function buildLevelsFromSetup(setup: {
  entry: number
  stopLoss: number
  tp1: number
  tp2: number
  tp3: number
}): PriceLevel[] {
  return [
    { label: "TP3", price: setup.tp3, tone: "long", opacity: 0.45 },
    { label: "TP2", price: setup.tp2, tone: "long", opacity: 0.7 },
    { label: "TP1", price: setup.tp1, tone: "long" },
    { label: "Entry", price: setup.entry, tone: "gold" },
    { label: "SL", price: setup.stopLoss, tone: "short" },
  ]
}
