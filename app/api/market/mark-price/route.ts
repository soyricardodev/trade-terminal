import { NextResponse } from "next/server"

import { fetchBinanceMarkPrice } from "@/lib/market/mark-price"
import { isValidBinanceSymbol } from "@/lib/market/symbols"

export const revalidate = 5

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const symbol = searchParams.get("symbol")?.toUpperCase() ?? ""

  if (!isValidBinanceSymbol(symbol)) {
    return NextResponse.json({ error: "Invalid symbol" }, { status: 400 })
  }

  try {
    const markPrice = await fetchBinanceMarkPrice(symbol)
    return NextResponse.json({ symbol, markPrice })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch mark price"
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
