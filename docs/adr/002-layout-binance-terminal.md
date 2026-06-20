# ADR 002: Binance-Style Terminal Layout

## Status

Accepted — June 2026

## Context

The original layout used `max-w-7xl` (~1280px) with inputs on the left and the risk dashboard on the right. On wide screens this left unused horizontal space and did not resemble a futures trading terminal.

## Decision

Adopt a **Binance-inspired desktop layout** within a wider content shell:

```
max-w-[1600px] mx-auto px-4 lg:px-8
```

### Desktop (`lg+`)

| Zone | Width | Content |
|------|-------|---------|
| Main column | `1fr` (flex-1, min-w-0) | Metric strip, chart + timeframe toolbar, price ladder, TP phase matrix |
| Order panel | `340px` sticky `top-14` | Collapsible VIP paste, Binance-style order form, Register trade |

Grid: `lg:grid-cols-[1fr_340px]`

### Header

- Pair selector (searchable, Binance USDT-M list) replaces static pair badge
- Direction badge remains when a valid setup exists

### Mobile

Unchanged philosophy: **chart-first** when analysis is available, order panel below, bottom nav + sticky Register CTA.

## Consequences

**Positive**

- Chart uses ~65% of usable width at 1440px+ viewports
- Order ticket reads as a dedicated trading panel, not a generic form
- Sticky order panel keeps margin/leverage controls visible while scrolling metrics

**Negative**

- Narrow tablets may still stack columns; 340px panel is desktop-targeted
- VIP paste moved to collapsible accordion to reduce vertical competition with chart

## Related components

- `components/signal-risk-suite/layout/trading-layout.tsx`
- `components/signal-risk-suite/app-shell.tsx`
- `components/signal-risk-suite/input/order-panel.tsx`
