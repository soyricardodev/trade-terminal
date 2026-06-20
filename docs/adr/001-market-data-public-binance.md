# ADR 001: Public Binance Market Data

## Status

Accepted — June 2026

## Context

Trade Terminal needs live perpetual futures prices and historical OHLC candles for the chart. The product does not yet integrate authenticated exchange accounts.

## Decision

Use **public** Binance USD-M Futures APIs only:

| Need | Source |
|------|--------|
| Symbol list (USDT-M perpetuals) | `GET fapi.binance.com/fapi/v1/exchangeInfo` |
| Historical klines (15m / 1h / 4h) | `GET fapi/v1/klines` via Next.js API route |
| Realtime last candle | WebSocket `wss://fstream.binance.com/ws/{symbol}@kline_{interval}` |

Server-side proxy routes (`/api/market/symbols`, `/api/market/klines`) centralize caching and avoid browser CORS issues.

### Caching

- **Symbols:** revalidate every 24 hours (`revalidate = 86400`)
- **Klines:** revalidate every 60 seconds per symbol+interval

### Realtime strategy

1. **REST bootstrap** — fetch ~200 candles when pair or interval changes; `series.setData()`
2. **WebSocket tail** — subscribe to kline stream; `series.update()` on each tick for the forming bar
3. **Reconnect** — exponential backoff capped at 30s
4. **Background tab** — pause WebSocket when `document.visibilityState === "hidden"`

### Fallback

If REST or WS fails (rate limit, offline, invalid symbol), the chart falls back to `synthetic-candles.ts` and shows an **"Offline — synthetic preview"** banner. Price level lines (entry, SL, TPs) still render from the trade setup.

## Consequences

**Positive**

- No API keys or account linking required
- Real market structure on chart with minimal infra
- Graceful degradation keeps the risk UI usable offline

**Negative / limits**

- No real account balance, positions, or order execution
- Rate limits apply; aggressive refetching must be avoided
- Mark/index price streams are available but not required for v1 chart

## Out of scope (current phase)

- Authenticated Binance trading
- Spot or coin-M markets
- Order book depth or trade tape
