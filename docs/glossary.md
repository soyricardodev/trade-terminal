# Glossary

Terms used across Trade Terminal risk analysis and market data features.

## Margin

USDT collateral allocated to a position. In the order panel, **margin** is the primary sizing input (`marginUsdt`). It represents how much of your simulated available balance you risk on the trade, not the full position value.

## Notional

Total position size in USDT: `margin × leverage`. Example: 100 USDT margin at 10× leverage → 1,000 USDT notional.

## Available balance (simulated)

Local setting for account size used by the margin percent slider. Default 1,000 USDT, persisted in `localStorage`. Not connected to a real exchange balance.

## Leverage

Multiplier applied to margin to derive notional exposure. Displayed as `10x`, `25x`, etc.

## Phase exit (50/30/20)

Take-profit scaling model: close 50% at TP1, 30% at TP2, 20% at TP3. Phase weights drive the TP phase matrix and max-gain calculations.

## Kline (candle)

OHLC bar for a time interval (15m, 1h, 4h). Sourced from Binance USD-M Futures public API; last bar updates in realtime via WebSocket.

## Mark price

Binance futures reference price for liquidation and PnL. Available via public `@markPrice` stream; not shown in v1 UI but documented for future use.

## Pair / symbol

- **Display pair:** `BNB/USDT` (UI and VIP parser)
- **Binance symbol:** `BNBUSDT` (API and WebSocket) — normalized via `toBinanceSymbol()`

## LONG / SHORT

- **LONG:** profit when price rises; SL below entry, TPs above entry
- **SHORT:** profit when price falls; SL above entry, TPs below entry

## Synthetic preview

Fallback candle data generated locally when Binance API is unavailable. Anchored around the trade setup prices; shown with an offline banner.

## VIP paste

Paste area for VIP signal messages. Extracts pair, direction, entry, SL, and TPs into the order panel without auto-changing margin or leverage.
