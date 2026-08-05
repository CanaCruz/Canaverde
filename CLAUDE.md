# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Mercado Canaverde — a static, client-side-only web app for comparing supplier prices from Excel spreadsheets. No build step, no custom backend, no package.json. Pure HTML/CSS/vanilla JS loaded via `<script>` tags and CDN libraries (SheetJS/XLSX for import/export on the main page, ExcelJS for the suppliers page export, Firebase compat SDK for the cloud quotation history — see below).

## Running locally

```bash
npx http-server -p 8081 -c-1 -o
```

Must be served over HTTP — opening `index.html` directly from disk breaks it (module/script loading and localStorage behave differently under `file://`).

There is no test suite, linter, or build command.

## Architecture

Two pages share state via `localStorage` (no server, no routing framework):

- **`index.html` + `js/script.js`** — Upload & analysis page. The `PriceAnalyzer` class parses the uploaded spreadsheet (first row = headers, first column = product name, other non-system columns = suppliers with prices), computes lowest prices per product, and renders the comparison table. On "go to suppliers" (`toggleMenu()`), it serializes its state to `localStorage['canaverdeData']` and also snapshots `localStorage['canaverdeDataOriginal']` (used later for "Resetar Tudo"). Before a working cotação (with quantities filled in) is discarded — new upload, or a fresh page load — `archiveCurrentCotacaoIfNeeded()` writes it to Firestore for the cloud history feature.
- **`pages/suppliers.html` + `js/suppliers.js`** — Fornecedores page. Reads `canaverdeData`, groups each supplier's lowest-priced products into cards, and supports quantity entry, unit selection, price comparison/swap (via the "⋮" product menu), product removal/restoration, WhatsApp text export, Excel export (highlighted cells, A4 print formatting with page numbers), and browsing the cloud quotation history ("📜 Histórico" button).
- **`css/styles.css`** — single shared stylesheet for both pages.
- **`js/firebase-config.js`** — Firebase project config + `db` (Firestore) instance, loaded on both pages before `script.js`/`suppliers.js`. Also defines `MAX_COTACOES_HISTORICO` (20).

### localStorage keys

Session data (cleared on new upload):
- `canaverdeData` — current working dataset (products, suppliers, prices, lowestPrices map)
- `canaverdeDataOriginal` — snapshot for "Resetar Tudo"
- `removedProducts`, `finishedSuppliers`, `productUnits` — per-session UI state

Persistent across uploads (memory features, never cleared by `clearData`):
- `productUnitPrefs` — user-chosen unit per product (keyed by `normalizeProductKey`)
- `productQuantityHistory` — last entered quantity per product, used to pre-fill and highlight (yellow) on next upload

Both of the above are mirrored to the cloud (see below) so they work across computers; localStorage is just the instant-read/offline-safe local cache.

### Cloud quotation history (Firestore)

The `cotacoes` collection in the `mercado-canaverde` Firebase project stores past quotations so they're browsable from any computer, not just the one that created them. No authentication — Firestore security rules restrict read/write to just the `cotacoes` and `memoria` collections, open (`allow read, write: if true`), no expiry. Acceptable tradeoff given the data isn't sensitive (product/supplier names and prices, no PII/payment info); anyone with the site's public Firebase config could technically write to these collections.

- Each document ID is the cotação's `timestamp` (ISO string) — writing twice for the same cotação overwrites rather than duplicates.
- Document shape: `{ timestamp, suppliers: string[], products: string[], data: [{product, supplier, price, quantity, ...}], grandTotal }`.
- Written by `archiveCurrentCotacaoIfNeeded()` in `script.js`, only when the outgoing cotação has at least one item with `quantity > 0`.
- Read by `openHistoryModal()` in `suppliers.js` (`js/suppliers.js`), querying the `MAX_COTACOES_HISTORICO` (20) most recent documents ordered by `timestamp desc`. Results are cached in the module-level `historyCache` for the detail view, to avoid extra reads.

### Cloud product memory (Firestore)

The `memoria/produtos` document (single doc, two map fields: `quantidades`, `unidades`) mirrors `productQuantityHistory`/`productUnitPrefs` to the cloud, so the last-ordered quantity and unit choice (e.g. cx → fd) for a product follow you to any computer, not just the one where you set them.

- `loadMemoryFromCloud()` (`suppliers.js`) runs once at the start of `loadSuppliersData()`, awaited before rendering, and overwrites the two localStorage keys with whatever's in Firestore. Fails silently (logs to console, keeps whatever's local) if offline/denied — never blocks rendering.
- `scheduleMemorySync()` debounces (1.5s) writes to Firestore, triggered from `saveUnitPreference()` and `saveQuantityHistory()`, so rapid edits (e.g. filling many quantities) don't spam the network with a write per keystroke.

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
