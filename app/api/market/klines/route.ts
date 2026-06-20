import { NextResponse } from "next/server"

import { fetchBinanceKlines } from "@/lib/market/klines"
import { isValidBinanceSymbol } from "@/lib/market/symbols"
import { CHART_INTERVALS, type ChartInterval } from "@/lib/market/types"

export const revalidate = 60

function parseInterval(value: string | null): ChartInterval | null {
  if (!value) return null
  return CHART_INTERVALS.includes(value as ChartInterval)
    ? (value as ChartInterval)
    : null
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const symbol = searchParams.get("symbol")?.toUpperCase() ?? ""
  const interval = parseInterval(searchParams.get("interval"))
  const limit = Math.min(
    Math.max(Number(searchParams.get("limit") ?? "200"), 1),
    500,
  )

  if (!isValidBinanceSymbol(symbol)) {
    return NextResponse.json({ error: "Invalid symbol" }, { status: 400 })
  }

  if (!interval) {
    return NextResponse.json({ error: "Invalid interval" }, { status: 400 })
  }

  try {
    const candles = await fetchBinanceKlines(symbol, interval, limit)
    const lastPrice = candles.at(-1)?.close ?? null
    return NextResponse.json({ symbol, interval, candles, lastPrice })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch klines"
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
