# Budgetflow v2 - Investment & Business Spending Tracker

Budgetflow v2 is a Vite + React + TypeScript application for tracking Malaysian/US investments, fixed deposits, and business expenses. It ships with a FastAPI backend (see FastAPI/) and Netlify serverless helpers for live market data.

## Getting Started

`powershell
npm install
npm run dev
`

The development server runs at http://localhost:5173.

### Package Scripts

| Command | Description |
| ------- | ----------- |
| 
pm run dev | Start Vite in dev mode |
| 
pm run build | Type-check then produce a production build |
| 
pm run preview | Preview the production bundle |
| 
pm run test | Run Vitest unit tests |

## Environment Variables

| Variable | Purpose |
| -------- | ------- |
| VITE_API_URL | Optional FastAPI base URL. Defaults to http://localhost:8000. |
| TWELVE_DATA_API_KEY | Twelve Data API key used by Netlify functions. |
| EODHD_API_KEY | EOD Historical Data API token. |

Create a .env file or configure Netlify/hosting secrets before building for production.

## FastAPI backend bridge

1. In a second terminal run the backend:
   `powershell
   cd FastAPI
   uvicorn app.main:app --reload
   `
2. (Optional) create VITE_API_URL=http://127.0.0.1:8000 in the front-end .env.
3. Visit /data inside the React app. The "FastAPI data bridge" card lets you create/delete **users** and **investments** using the Excel-approved schema. Every submit immediately re-fetches from FastAPI via React Query so you can visually confirm persistence.
4. For CLI verification, follow the tutorial in FastAPI/README.md (curl examples + Swagger links).

## Serverless Functions

Located in 
etlify/functions/:

- price.ts – GET /.netlify/functions/price?symbol=AAPL to fetch one or more quotes.
- prices-batch.ts – POST /.netlify/functions/prices-batch for batched quote refreshes.
- x.ts – GET /.netlify/functions/fx?base=USD&quote=MYR for FX rates.

Each function performs retry/backoff and minor response caching to stay within vendor limits.

## Data layer & offline support

- Zustand store + persist middleware keeps holdings, transactions, and settings in localStorage.
- /data now has three capabilities: JSON snapshot import/export, manual transaction editing, and the FastAPI bridge.
- React Query handles all remote state (market data, FX, backend CRUD) with deduped polling.

## Testing

`powershell
npm run test
`

Vitest currently covers calculator utilities and vendor symbol helpers. Back-end tests live under FastAPI/tests (run with python -m pytest).

## Deployment notes

- 
etlify.toml points to dist/ and bundles the serverless functions.
- public/_redirects keeps SPA routing working on Netlify.
- For production FastAPI deployments, review the guidance in FastAPI/README.md (CORS, Gunicorn, database backups).

Enjoy tracking your portfolio with live MYX/US market data plus a true backend for relational storage!
