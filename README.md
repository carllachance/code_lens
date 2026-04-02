# Code Lens v1

Code Lens v1 is a VS Code extension that builds a local graph of TypeScript/React symbols and shows a "lens" panel for symbol focus, related edges, traces, tests, and grounded summaries.

## Install

### 1) Prerequisites
- Node.js 20+
- npm 10+
- VS Code 1.92+

### 2) Install dependencies
```bash
npm ci
```

### 3) Build
```bash
npm run build
```

### 4) Run in VS Code (development)
1. Open this folder in VS Code.
2. Press `F5` to launch an Extension Development Host.
3. In the new window, open a TypeScript/TSX workspace.
4. Run **Code Lens: Refresh Index** from the Command Palette.

### 5) (Optional) Package as VSIX
If you want to install it like a normal extension:
```bash
npm i -D @vscode/vsce
npx vsce package
```
Then in VS Code: **Extensions → ... → Install from VSIX...**

## Available Commands ("functions")

These are the user-facing extension functions exposed in the Command Palette:

- `Code Lens: Open Panel` (`codeLens.openPanel`)
- `Code Lens: Refresh Index` (`codeLens.refreshIndex`)
- `Code Lens: Reindex Current File` (`codeLens.reindexCurrentFile`)
- `Code Lens: Trace Outward` (`codeLens.traceOutward`)
- `Code Lens: Trace Inward` (`codeLens.traceInward`)
- `Code Lens: Show Neighborhood` (`codeLens.showNeighborhood`)
- `Code Lens: Toggle Evidence Filter` (`codeLens.toggleEvidenceFilter`)

## npm Scripts
- `npm run build` — compile TypeScript to `out/`
- `npm run check` — type-check with no emit

## How it works (high-level)
1. Activation happens for TypeScript/TSX files or when opening the Code Lens panel.
2. The extension indexes the workspace into a local SQLite-backed graph.
3. Selecting symbols updates the webview panel with focus info.
4. Missing explanations are generated and cached for future views.
5. Trace commands show inward/outward dependency paths.

## Troubleshooting
- If the panel is empty, run **Code Lens: Refresh Index** first.
- If symbols are stale, run **Code Lens: Reindex Current File**.
- If build fails, ensure your Node/npm versions match prerequisites.
