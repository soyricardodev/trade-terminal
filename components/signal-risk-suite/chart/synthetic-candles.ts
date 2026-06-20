import type { CandlestickData, UTCTimestamp } from "lightweight-charts"

import type { TradeSetup } from "@/lib/signal-risk/types"

const BAR_COUNT = 50
const BAR_INTERVAL_SEC = 3600

function seededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return (s - 1) / 2147483646
  }
}

function hashSetup(setup: TradeSetup): number {
  const str = `${setup.pair}${setup.entry}${setup.stopLoss}${setup.tp3}`
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

export function generateSyntheticCandles(setup: TradeSetup): CandlestickData<UTCTimestamp>[] {
  const { entry, stopLoss, tp1, tp2, tp3, direction } = setup
  const prices = [entry, stopLoss, tp1, tp2, tp3]
  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)
  const range = maxPrice - minPrice || entry * 0.02
  const padding = range * 0.15
  const floor = minPrice - padding
  const ceiling = maxPrice + padding

  const rand = seededRandom(hashSetup(setup))
  const centerIndex = Math.floor(BAR_COUNT / 2)
  const baseTime = Math.floor(Date.now() / 1000) - centerIndex * BAR_INTERVAL_SEC

  const candles: CandlestickData<UTCTimestamp>[] = []
  let close = entry

  for (let i = 0; i < BAR_COUNT; i++) {
    const distFromCenter = Math.abs(i - centerIndex)
    const pullToEntry = (entry - close) * (0.08 + distFromCenter * 0.01)
    const volatility = entry * 0.003 * (1 + rand() * 0.5)
    const drift =
      direction === "LONG"
        ? (rand() - 0.42) * volatility
        : (rand() - 0.58) * volatility

    const open = close
    close = Math.min(ceiling, Math.max(floor, close + pullToEntry + drift))
    const wick = volatility * (0.3 + rand() * 0.7)
    const high = Math.min(ceiling, Math.max(open, close) + wick * rand())
    const low = Math.max(floor, Math.min(open, close) - wick * rand())

    candles.push({
      time: (baseTime + i * BAR_INTERVAL_SEC) as UTCTimestamp,
      open,
      high,
      low,
      close,
    })
  }

  return candles
}

export function getPriceRange(setup: TradeSetup): { min: number; max: number } {
  const prices = [setup.entry, setup.stopLoss, setup.tp1, setup.tp2, setup.tp3]
  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)
  const range = maxPrice - minPrice || setup.entry * 0.02
  const padding = range * 0.15
  return { min: minPrice - padding, max: maxPrice + padding }
}
