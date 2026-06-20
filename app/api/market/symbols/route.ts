import { NextResponse } from "next/server"

import { fetchUsdtPerpetualSymbols } from "@/lib/market/exchange-info"

export const revalidate = 86400

export async function GET() {
  try {
    const symbols = await fetchUsdtPerpetualSymbols()
    return NextResponse.json({ symbols })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch symbols"
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
