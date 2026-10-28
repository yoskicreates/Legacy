# L3-030 — Typed manual career save slots (review)

## Scope

Three explicit V1 slot identifiers (`slot-1`, `slot-2`, `slot-3`) with persisted metadata and strictly validated game-state snapshot. A caller supplies `savedAtEpochMs` (nonnegative safe integer Unix epoch milliseconds), avoiding ambient wall-clock dependencies. `saveManualSlot` writes metadata and snapshot together in one IndexedDB record / transaction; success is emitted only on transaction `oncomplete`. `loadManualSlot` revalidates all stored content and rejects any mismatched identity, corrupted RNG, unknown fields/versions, or invalid metadata. `listManualSlots` returns stable ordered metadata for all slots and does not hide corrupt occupied slots.

## API

- `saveManualSlot(slotId, state, savedAtEpochMs, options?: {factory?, signal?})`
- `loadManualSlot(slotId, options?: {factory?})`
- `listManualSlots(options?: {factory?})`
- `MANUAL_SAVE_SLOT_IDS = ['slot-1','slot-2','slot-3']`

Slot records use database `LEGACY3_MANUAL_SLOTS_V1`, version 1, store `manual-careers`, keyed by `slotId`. This is intentionally **separate** from `LEGACY3_CORE_V1/core-state/current`: legacy autosave writes/read remain unchanged. No schema upgrade, migration, deleted slots, autosave scheduling, manual UI, import/export, gameplay, or background sync is introduced.

## Acceptance checks

- Two unique careers can be saved, repeatedly loaded in alternating order, and retain distinct identity, RNG/clocks, and saved-at timestamps after browser reload.
- Re-saving one slot does not affect another slot, nor the existing L3-029 autosave record.
- Invalid state/timestamp/slot/future schema never opens the database or mutates existing records.
- Pre-aborted and genuinely aborted IndexedDB transactions do not delete a previous valid record and must not report success; backend errors are surfaced explicitly.
- Tampered metadata and state are errors, never silently rewritten or misclassified as empty slots.
- Node unit tests, strict positive and negative compiler tests, clean `npm ci`, Vite build, all prior L3-020–L3-029 regression workflows, Chromium dev/preview QA at 375/390/402/430, checkpoint hashes/CRC.

## Constraints

The fixed slots are persistence APIs only; there is no in-game save/load UI or complete career state yet. Browser storage can be cleared or evicted, and actual iPhone Safari is **NOT_RUN**. Real player import/export and migrations are L3-031 and L3-032; they are NOT_STARTED. Exact time is provided by the caller: the game clock is not advanced by saving.
