# Budgetflow v2 – Investment & Business Spending Tracker

Budgetflow v2 is a Vite + React + TypeScript application that tracks investment holdings, fixed deposits, and business expenses with live market data for MYX and US tickers. The app is optimised for Netlify hosting with serverless functions to proxy Twelve Data or EOD Historical Data APIs and persistently stores data client-side (Zustand + localStorage) with optional JSON exports.

## Getting Started

`ash
npm install
npm run dev
`

The development server runs at http://localhost:5173.

### Scripts

| Command          | Description                          |
| ---------------- | ------------------------------------ |
| 
pm run dev    | Start Vite dev server                |
| 
pm run build  | Type-check then build for production |
| 
pm run preview| Preview the production build         |
| 
pm run test   | Run Vitest unit tests                |

## Environment Variables

Netlify functions pick up API keys from environment variables. Configure these in Netlify (or a local .env file when using the Netlify CLI):

- TWELVE_DATA_API_KEY – API key for Twelve Data
- EODHD_API_KEY – API token for EOD Historical Data

You can also supply a key at runtime via the Settings page; the key is sent to serverless functions and never stored in compiled client code.

## Serverless Functions

Located under 
etlify/functions/:

- price.ts – GET endpoint /.netlify/functions/price?symbol=AAPL to fetch one or more quotes.
- prices-batch.ts – POST endpoint for batch quote refresh { symbols: ["AAPL", "1155:MYX"], vendor: "twelve-data" }.
- x.ts – GET endpoint /.netlify/functions/fx?base=USD&quote=MYR to fetch FX rates.

Each function caches responses in-memory (60s for US, 5 minutes for MYX) and performs exponential backoff on HTTP 429.

## Data Layer & Offline Support

- Zustand store with persist middleware keeps holdings, transactions, and settings in localStorage.
- The Data page allows exporting/importing JSON snapshots via the File System Access API (with download fallback).
- React Query powers price polling with deduped requests (usePrices, useFxRate).

## Testing

Vitest covers the calculation utilities and vendor symbol normalisation:
`ash
npm run test
`

## Deployment Notes

- 
etlify.toml already points Netlify to dist and the functions directory, using the esbuild bundler.
- public/_redirects ensures SPA routing (/* /index.html 200).
- Adjust ite.config.ts or Netlify build settings if you need a different base path.

## Folder Structure Highlights

`
src/
  components/      UI components (forms, tables, charts)
  hooks/           Custom hooks for settings, date ranges, prices
  lib/             Core logic (calc, datastore, vendor helpers)
  pages/           Routed pages (Dashboard, Investments, Business, etc.)
netlify/functions/ Serverless function handlers
`

Enjoy tracking your investments and business spend with live MYX/US market data!
