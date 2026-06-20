const BINANCE_FAPI = "https://fapi.binance.com"

interface BinancePremiumIndex {
  markPrice: string
}

export async function fetchBinanceMarkPrice(symbol: string): Promise<number> {
  const url = new URL(`${BINANCE_FAPI}/fapi/v1/premiumIndex`)
  url.searchParams.set("symbol", symbol)

  const response = await fetch(url, { next: { revalidate: 5 } })
  if (!response.ok) {
    throw new Error(`Binance mark price failed: ${response.status}`)
  }

  const data = (await response.json()) as BinancePremiumIndex
  const price = Number(data.markPrice)
  if (!Number.isFinite(price)) {
    throw new Error("Invalid mark price from Binance")
  }

  return price
}
