# L3-029 — Atomic autosave transaction

**Scope:** An explicitly invoked autosave of a single, strictly validated V1 core snapshot to the existing L3-028 IndexedDB store. No autosave timers or UI triggers exist yet because game decisions and simulation are not implemented. The name describes the persistence operation, **not** a functioning background autosave system.

## Contract

- `autosaveGameState(candidate, {databaseName?, factory?, signal?})` validates state through L3-027 and delegates to the L3-028 fixed-record writer; success has frozen `{ok:true,value:{committed:true,schemaVersion:1}}` and is emitted only after IDB **transaction.oncomplete**.
- Invalid or unsupported values are rejected before opening storage. Failed or aborted write transactions never emit receipts and, under IndexedDB atomicity, do not overwrite a previously committed record.
- Optional `AbortSignal` aborts a pending transaction; cancellation after a genuine commit cannot revoke it. `WRITE_ABORTED` is separate from generic `TRANSACTION_ERROR`.
- `readAutosavedGameState()` delegates to L3-028's strict untrusted-record validation; state is immutable and retains random seed/draws and independent clocks across reload.
- Exactly one record `LEGACY3_CORE_V1/core-state/current`; no scheduler, per-user account, timestamps, background service, multiple slots, migration or import/export.

## Acceptance

AT-01 Strict positive and five deliberately invalid TS fixtures; no domain graph violation.
AT-02 Node tests for valid receipt, abort signal, aborted transaction, failed transaction, invalid writes, unsupported version, unsupported browser and open errors.
AT-03 Real Chromium at 375/390/402/430 CSS px for Vite dev and preview. Verify initial save, atomic replacement, invalid/future/cancelled/database-failed writes, **real transaction abort after queued put**, prior value retained, and full-page reload preserves exact RNG/clocks.
AT-04 Existing L3-020–L3-028 automated browser and Node regressions, clean `npm ci`, real Vite build and dist smoke.
AT-05 Archive/source SHA-256, CRC integrity, full original local Git history, unchanged parent file hashes and fresh non-overwriting Library checkpoints. Merge only if all checks pass.

## Limitations

No actual game decisions exist to invoke autosave automatically. Browser IndexedDB is not permanent storage guaranteed by the OS (private browsing/quota/site data clearing). Actual physical iPhone Safari: NOT_RUN. No app has been launched to the public. L3-030 remains NOT STARTED.
