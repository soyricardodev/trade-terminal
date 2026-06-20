# ADR 001: Signal Risk Calculator

## Status

Accepted

## Context

Signal Risk Suite needs a deterministic, client-side risk engine for leveraged crypto trades with three take-profit levels and a single stop loss. VIP signals specify TP1–TP3; the product assumes a **50/30/20** partial exit model.

## Decision

Implement pure TypeScript functions in `lib/signal-risk/calculator.ts` with no React dependencies.

### Constants

```typescript
const EXIT_WEIGHTS = [0.5, 0.3, 0.2] as const
```

### Price move percentage

Always a **positive magnitude** toward the target:

```typescript
// LONG: price rises toward TP, falls toward SL
priceMovePct(entry, target, direction) =
  direction === 'LONG'
    ? ((target - entry) / entry) * 100
    : ((entry - target) / entry) * 100
```

### Notional and phase PnL

```typescript
notional = marginUsdt * leverage
phasePnlUsdt = notional * weight * (priceMovePct / 100)
leveragedRoiPct = priceMovePct * leverage
```

### Worst case (stop loss)

```typescript
slMovePct = abs(priceMovePct(entry, stopLoss, direction))
maxLossUsdt = notional * (slMovePct / 100)
maxLossRoiPct = -(slMovePct * leverage)
```

### Best case (all TPs)

```typescript
maxGainUsdt = sum(phasePnl for TP1..TP3)
maxGainRoiPct = (maxGainUsdt / marginUsdt) * 100
```

### Risk:reward per phase

```typescript
rrRatio = priceMovePct(entry, tpN, direction) / slMovePct
```

Leverage appears in ROI but cancels in R:R because both numerator and denominator scale with distance ratios.

### Journal PnL (on close)

Single exit price; no per-phase tracking in v1:

```typescript
// LONG
pnlUsdt = notional * ((actualExit - actualEntry) / actualEntry)
// SHORT: invert numerator direction
```

## Validation (Zod)

- All prices > 0; `leverage >= 1`; `marginUsdt > 0`.
- **LONG**: `stopLoss < entry`, `tp1 < tp2 < tp3`, each TP > entry.
- **SHORT**: `stopLoss > entry`, `tp1 > tp2 > tp3`, each TP < entry.

## Consequences

- Loss at SL is proportional to **notional × SL distance**, not necessarily equal to margin.
- Dashboard shows **planned** partial TP outcomes; journal reflects **actual** single exit.
- Unit tests lock numeric precision for reference setups (e.g. BNB SHORT from `ejemplos.txt`).
