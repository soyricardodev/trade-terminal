# Trade Terminal

A local-first futures risk terminal for turning VIP signals into explicit, reviewable trade plans.

**[Open the demo](https://trade-terminal-rho.vercel.app)**

## What it does

- Parses a pasted signal into entry, stop-loss, and take-profit levels
- Calculates position size, margin, leverage, unrealized PnL, and risk scenarios
- Models staged exits with a 50/30/20 plan and phase matrix
- Shows live Binance USD-M Futures candles with entry, SL, and TP overlays
- Keeps a local trade journal with import and export

The app is an analysis and journaling tool. It does not place orders or provide financial advice.

## Stack

Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 · lightweight-charts · Zod · shadcn/ui

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run build       # production build
npm run typecheck   # TypeScript validation
npm test            # unit tests for risk and signal logic
npm run backtest:vip
```

## Project structure

- `lib/` contains signal parsing, risk calculations, and journal logic.
- `app/` contains the Next.js application and routes.
- `components/` contains the interface and chart panels.
- `scripts/` contains the VIP signal backtest.

## License

MIT. See [LICENSE](./LICENSE).
