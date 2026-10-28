# L3-028 — Scoped browser IndexedDB storage (not a save system)

This milestone implements only a single fixed-key V1 *core snapshot* read/write wrapper in the persistence domain. The database `LEGACY3_CORE_V1`, object store `core-state`, database version `1` and key `current` are explicit. No gameplay data is generated, no save slots or autosave are available, and opening a database is not a career-load operation.

## Contracts

- `writeGameState(candidate, options?)` first invokes strict L3-027 runtime validation. Invalid payloads and unsupported versions are rejected **before opening storage** and never overwrite a committed record. It resolves success **only on `transaction.oncomplete`**, not a request success event.
- `readGameState(options?)` reads only the fixed key. A truly absent record returns `{ok:true,value:null}`. All other stored values are untrusted: the same V1 validator rejects corruption, extra fields, invalid RNG state and unsupported future schema versions. Valid results are independent, deeply frozen snapshots.
- Both functions return typed result discriminants with explicit `UNSUPPORTED_BROWSER`, `DATABASE_ERROR`, `DATABASE_BLOCKED`, `STORE_MISSING`, `TRANSACTION_ERROR`, `INVALID_STATE`, `CORRUPT_STATE`, `UNSUPPORTED_VERSION` cases. Aborted writes are not reported as successful.
- The optional IDBFactory and database-name injection are test hooks only; do not implement save slots. On actual page use, the browser's global `indexedDB` factory is used. Connections close after all outcomes. Existing higher database versions are not downgraded or migrated. The V1 object store is created on initial database version upgrade only.
- This is browser-local **best-effort** storage; persistence is not guaranteed when the browser clears site data, uses private mode, or denies quota. No online account, cloud sync, or automatic backups exist.

## Acceptance

Run `npm ci`, `npm run typecheck:indexeddb`, `npm run test:indexeddb:negative`, `npm run test:indexeddb`, the complete `npm run verify` suite, then `npm run build`. Real Chromium dev and production preview checks exercise empty reads, committed V1 round trips, full reload persistence, invalid writes with no overwrite, corrupted and future-version stored records, null records, unsupported factory, and thrown database-open errors. All prescribed 375/390/402/430 CSS px widths are covered; existing boundary/UI mobile checks also cover desktop. The QA HTML page is an isolated test harness, not a game UI or production career screen.

## Not started

L3-029 autosave; manual save slots; import/export; schema migration; recovery UI; gameplay; backend; synchronization. Physical iPhone Safari is **NOT_RUN** until individually verified on a real device.
