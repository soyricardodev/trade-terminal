import type { TradeSetup } from "@/lib/signal-risk/types"

export interface ChartPriceFormat {
  type: "price"
  precision: number
  minMove: number
}

function decimalPlaces(value: number): number {
  const text = value.toString()
  const index = text.indexOf(".")
  if (index < 0) return 0
  return text.length - index - 1
}

export function derivePriceFormatFromLevels(levels: number[]): ChartPriceFormat {
  const positiveLevels = levels.filter((level) => level > 0)
  const minLevel = positiveLevels.length > 0 ? Math.min(...positiveLevels) : 1
  const maxDecimals = Math.max(...positiveLevels.map(decimalPlaces), 0)

  if (minLevel >= 100) {
    return { type: "price", precision: 2, minMove: 0.01 }
  }

  if (minLevel >= 1) {
    const precision = Math.max(maxDecimals, 4)
    return { type: "price", precision, minMove: 10 ** -precision }
  }

  const precision = Math.min(Math.max(maxDecimals, 5), 8)
  return { type: "price", precision, minMove: 10 ** -precision }
}

export function derivePriceFormatFromSetup(setup: TradeSetup): ChartPriceFormat {
  return derivePriceFormatFromLevels([
    setup.entry,
    setup.stopLoss,
    setup.tp1,
    setup.tp2,
    setup.tp3,
  ])
}

export function formatLevelLabel(price: number, format: ChartPriceFormat): string {
  return price.toFixed(format.precision)
}

export function visiblePriceRange(
  setup: TradeSetup,
  candles: { high: number; low: number }[],
): { from: number; to: number } {
  const levels = [setup.entry, setup.stopLoss, setup.tp1, setup.tp2, setup.tp3]
  const candleHigh = candles.length > 0 ? Math.max(...candles.map((c) => c.high)) : setup.entry
  const candleLow = candles.length > 0 ? Math.min(...candles.map((c) => c.low)) : setup.entry

  const max = Math.max(...levels, candleHigh)
  const min = Math.min(...levels, candleLow)
  const pad = Math.max((max - min) * 0.12, max * 0.002)

  return { from: min - pad, to: max + pad }
}
