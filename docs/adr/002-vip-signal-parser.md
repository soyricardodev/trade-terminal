# ADR 002: VIP Signal Parser

## Status

Accepted

## Context

VIP trading signals arrive as unstructured Spanish prose with a semi-structured header. The app must prefill the trade setup form while tolerating format drift and known inconsistencies (e.g. SL in justification differs from plan).

## Decision

Implement `parseVipSignal(text)` in `lib/vip-signal/parser.ts` returning `ParsedVipSignal | null` plus `warnings[]`.

### Source priority

| Field | Source | Fallback |
|-------|--------|----------|
| Asset / direction | `$SYMBOL - CORTO\|LONG` | — (parse fails) |
| Entry | **Plan de Comercio** only | — |
| Stop loss | Plan de Comercio `Stop Loss:` | — |
| TP1–TP3 | `Take Profits:` block | — |
| Invalidation | `⚠️ Mientras el precio...` | Warning only |

Prose mentions of SL/TP in **Justificación** are ignored for extraction.

### Asset normalization

Regex: `\$([A-Z0-9]+)\s*-\s*(CORTO|LONG)`

- `CORTO` → `SHORT`
- Output pair: `{SYMBOL}/USDT`

### Entry rules

From line `Entrada:` inside Plan de Comercio:

1. **Single value**: `580.55` or `580.55 (ORDEN LIMIT)`
2. **Range**: `599 – 600` or `0.1622 - 0.1626` → use **minimum** as `entry`; store `entryMin` / `entryMax` for UI.

### Stop loss mismatch warning

If invalidation text cites a price different from plan SL (e.g. SUI plan `0.7300` vs text `0.7330`, ENA plan `0.08950` vs text `0.08920`):

- Emit warning string
- **Do not** overwrite plan SL

### Fields not in VIP

`marginUsdt` and `leverage` are omitted; user completes them in the form after paste.

### Failure modes

Return `null` when:

- No asset/direction match
- No Plan de Comercio section
- Missing entry or stop loss
- Any of TP1–TP3 missing

Manual entry remains always available.

## Consequences

- Parser is tolerant but explicit about ambiguity via warnings.
- Range entries default to conservative (minimum) entry for risk sizing.
- Tests cover all nine signals in `ejemplos.txt` plus BNB/XRP/ADA reference cases.
