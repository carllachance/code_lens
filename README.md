# Code Lens v1

Code Lens v1 is a local browser-based app that builds a graph of TypeScript/React symbols from any folder on disk and shows a lens for symbol focus, related edges, traces, tests, and grounded summaries.

## Run

### 1) Prerequisites
- Node.js 20+
- npm 10+

### 2) Install dependencies
```bash
npm ci
```

### 3) Build
```bash
npm run build
```

### 4) Start the local app
```bash
npm start
```

Then open [http://localhost:4310](http://localhost:4310) in your browser and paste the folder path you want to index.

## What You Can Do

- Open any local TypeScript or TSX workspace by path
- Build or rebuild the symbol graph on demand
- Search symbols by name, id, or file path
- Filter symbols by kind
- Inspect symbol identity, explanation, boundaries, risks, related tests, and traces

## npm Scripts

- `npm run build` - compile TypeScript to `out/`
- `npm run check` - type-check with no emit
- `npm start` - run the local web server

## How it works

1. You start the local Node server and open the browser UI.
2. The app indexes the target folder into a local SQLite-backed graph cache.
3. Selecting symbols loads focus info, related edges, and inward/outward traces.
4. Missing explanations are generated and cached for future views.

## Troubleshooting

- If no symbols appear, make sure the target folder contains `.ts` or `.tsx` files.
- If symbols look stale, click `Reindex`.
- If build fails, ensure your Node/npm versions match prerequisites.
