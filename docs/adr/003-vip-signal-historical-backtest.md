# ADR 003: VIP Signal Historical Backtest

## Status

Accepted

## Context

The Telegram VIP channel export (`result.json`) contains ~100 trading signals over time. We need to measure hypothetical performance using Binance Futures 1-minute klines, the existing 50/30/20 exit model, and conservative fill assumptions — without manual journal entry.

## Decision

Implement a CLI-driven backtest pipeline under `lib/vip-history/` with a read-only UI tab.

### Ingestion

- Filter Telegram export messages containing `SEÑAL VIP`
- Parse with `parseVipSignal()` (supports `$SYMBOL/USDT` format)
- Skip unlisted Binance Futures perpetual symbols (`symbol_not_listed`)
- Skip unparseable messages (`parse_failed`)

### Observation window

Default **24 hours** from `date_unixtime` (configurable via `--hours`). All simulation occurs within `[signalTime, signalTime + observationHours]`.

### Limit-order fill (conservative)

1. Walk 1m candles chronologically from signal time
2. **Range entry** `[entryMin, entryMax]`: candle enters range when `low <= entryMax && high >= entryMin`
   - LONG fill at `entryMax` (worst case for buyer)
   - SHORT fill at `entryMin` (worst case for seller)
3. **Point entry**: fill when `low <= entry <= high`
4. No fill before window end → outcome `not_executed`

### Post-entry walk-forward

State: `remainingWeight`, `stopLoss`, `entryPrice`, `realizedPnl`.

Per candle, evaluate events in **conservative order**:

1. **Stop loss** — if touched, close entire remaining weight at SL
2. **TP1 / TP2 / TP3** — realize 50% / 30% / 20% of original notional at target price
3. After **TP1**: move SL to entry (breakeven on remainder)

**Same-candle ambiguity:** SL is checked before TPs. If both are reachable on one bar, SL wins (conservative).

### Position close at window end

If weight remains open at the last candle, close at that bar's `close` → outcome `timeout`.

### Default simulation params

| Parameter | Value |
|-----------|-------|
| `marginUsdt` | 1000 |
| `leverage` | 5 |
| `observationHours` | 24 |
| Exit weights | 50% TP1, 30% TP2, 20% TP3 |

PnL uses `priceMovePct` and `EXIT_WEIGHTS` from `lib/signal-risk/calculator.ts`. ROI is computed on margin (1000 USDT baseline).

### Outcomes

| Outcome | Condition |
|---------|-----------|
| `not_executed` | Price never entered range |
| `no_data` | No klines returned for window |
| `loss` | Net PnL negative (typically full SL) |
| `breakeven` | TP1 hit, remainder stopped at entry, net ~0 |
| `partial_win` | TP1 and/or TP2 hit, net PnL > 0, TP3 not hit |
| `full_win` | TP3 hit |
| `win` | Net PnL > 0 without partial/full classification |
| `timeout` | Open position closed at window end |

### Klines

- Source: Binance USD-M Futures `/fapi/v1/klines`, interval `1m`
- Paginated fetch (max 1500 bars per request) via `fetchBinanceKlinesRange`
- Disk cache at `data/klines-cache/{SYMBOL}-{start}-{end}.json`
- CLI throttle: ~200ms between requests

### Deliverables

- CLI: `bun run backtest:vip -- --input result.json --output data/vip-backtest-results.json`
- Intermediate: `data/vip-signals-clean.json`
- UI: **Historial VIP** tab loads `public/data/vip-backtest-results.json`

## Consequences

- Backtest results depend on Binance data availability; future-dated export timestamps may yield `no_data`
- Conservative rules understate optimistic fills (intentional)
- `result.json` is gitignored; only generated JSON artifacts are committed
- Parser ADR 002 asset regex is extended for `$SYMBOL/USDT` without breaking `$SYMBOL - CORTO|LONG`
