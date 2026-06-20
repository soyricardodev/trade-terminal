# Trade Terminal

VIP signal parser, leveraged futures risk calculator, and local trade journal. Binance-inspired UI with live klines from public Binance USD-M Futures data.

## Features

- Paste VIP signals to prefill entry, stop loss, and take-profit levels
- 50/30/20 reactive exit model with worst/best case and phase matrix
- Live price chart (15m / 1h / 4h) with entry / SL / TP overlays
- Order panel with leverage presets, margin sizing, and unrealized PnL
- Local trade journal with export/import

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run typecheck` | TypeScript check |
| `npm test` | Run unit tests |

## Stack

Next.js 16 · React 19 · Tailwind CSS 4 · lightweight-charts · shadcn/ui

## License

MIT
