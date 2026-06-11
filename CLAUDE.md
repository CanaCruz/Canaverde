# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Mercado Canaverde — a static, client-side-only web app for comparing supplier prices from Excel spreadsheets. No build step, no backend, no package.json. Pure HTML/CSS/vanilla JS loaded via `<script>` tags and CDN libraries (SheetJS/XLSX for import/export on the main page, ExcelJS for the suppliers page export).

## Running locally

```bash
npx http-server -p 8081 -c-1 -o
```

Must be served over HTTP — opening `index.html` directly from disk breaks it (module/script loading and localStorage behave differently under `file://`).

There is no test suite, linter, or build command.

## Architecture

Two pages share state via `localStorage` (no server, no routing framework):

- **`index.html` + `js/script.js`** — Upload & analysis page. The `PriceAnalyzer` class parses the uploaded spreadsheet (first row = headers, first column = product name, other non-system columns = suppliers with prices), computes lowest prices per product, and renders the comparison table. On "go to suppliers" (`toggleMenu()`), it serializes its state to `localStorage['canaverdeData']` and also snapshots `localStorage['canaverdeDataOriginal']` (used later for "Resetar Tudo").
- **`pages/suppliers.html` + `js/suppliers.js`** — Fornecedores page. Reads `canaverdeData`, groups each supplier's lowest-priced products into cards, and supports quantity entry, unit selection, packaging (`itens por embalagem`), drag-and-drop between suppliers, price comparison/swap, product removal/restoration, WhatsApp text export, and Excel export (highlighted cells, A4 print formatting with page numbers).
- **`css/styles.css`** — single shared stylesheet for both pages.

### localStorage keys

Session data (cleared on new upload):
- `canaverdeData` — current working dataset (products, suppliers, prices, lowestPrices map)
- `canaverdeDataOriginal` — snapshot for "Resetar Tudo"
- `removedProducts`, `finishedSuppliers`, `productUnits` — per-session UI state

Persistent across uploads (memory features, never cleared by `clearData`):
- `productUnitPrefs` — user-chosen unit per product (keyed by `normalizeProductKey`)
- `productPackSizes` — "itens por embalagem" per product
- `productQuantityHistory` — last entered quantity per product, used to pre-fill and highlight (yellow) on next upload

### Spreadsheet parsing rules (`script.js`)

- Column 0 = product name (required).
- A "quantity" column is auto-detected by keyword match (`quantidade`, `qtd`, etc.) and ignored on import.
- Any other column whose header doesn't match a reserved system keyword (see `systemKeywords` in `processData`) is treated as a supplier with numeric prices.
- `parsePrice()` handles both `1.234,56` and `1,234.56` style numbers and strips currency symbols.

### Unit auto-detection (`suppliers.js`)

`detectUnitFromProduct()` matches product names against `UNIT_AUTO_RULES` keyword lists; the **longest matching keyword wins** (more specific match takes priority over a shorter generic one). Manual overrides are persisted in `productUnitPrefs` and marked with a badge ("detectado" vs. manual).

### Debugging

Both `script.js` and `suppliers.js` define a module-level `DEBUG` constant gating a `log()` helper. Set `DEBUG = true` in the relevant file to get verbose console tracing of parsing/state changes.

## Conventions

- Commit messages follow Conventional Commits: `feat:`, `fix:`, `docs:`, `refactor:`, `revert:`.
- All user-facing text is in Portuguese (pt-BR).
- Always use `escapeHtml()` when inserting spreadsheet-derived strings into the DOM.
