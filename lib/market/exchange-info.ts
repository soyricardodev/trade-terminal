import type { MarketSymbol } from "@/lib/market/types"
import { toDisplaySymbol } from "@/lib/market/symbols"

const BINANCE_FAPI = "https://fapi.binance.com"

interface BinanceExchangeInfo {
  symbols: Array<{
    symbol: string
    status: string
    baseAsset: string
    quoteAsset: string
    contractType: string
  }>
}

export async function fetchUsdtPerpetualSymbols(): Promise<MarketSymbol[]> {
  const response = await fetch(`${BINANCE_FAPI}/fapi/v1/exchangeInfo`, {
    next: { revalidate: 86400 },
  })

  if (!response.ok) {
    throw new Error(`Binance exchangeInfo failed: ${response.status}`)
  }

  const data = (await response.json()) as BinanceExchangeInfo

  return data.symbols
    .filter(
      (item) =>
        item.status === "TRADING" &&
        item.quoteAsset === "USDT" &&
        item.contractType === "PERPETUAL",
    )
    .map((item) => ({
      symbol: item.symbol,
      display: toDisplaySymbol(item.symbol),
      baseAsset: item.baseAsset,
      quoteAsset: item.quoteAsset,
    }))
    .sort((a, b) => a.display.localeCompare(b.display))
}
