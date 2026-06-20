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

## Backtest

Offline simulation of historical VIP signals against Binance Futures 1m klines. Uses limit-order fill assumptions, 50/30/20 exits, and breakeven SL after TP1. Run via `bun run backtest:vip`; results appear in the **Historial VIP** tab.

## Signal outcome

Classification of a simulated VIP trade: `not_executed`, `loss`, `breakeven`, `win`, `partial_win`, `full_win`, `timeout`, or `no_data`. Derived from fill status, TP hits, and net PnL.

## Not executed

The price never touched the entry range within the observation window. No position was opened in the simulation.

## Breakeven stop

After TP1 fills (50% closed), stop loss moves to the entry price. If the remainder is stopped at entry, net PnL is approximately zero.

## Observation window

Time span after a signal timestamp during which entry and exit are evaluated. Default 24 hours (`--hours` flag on CLI).
