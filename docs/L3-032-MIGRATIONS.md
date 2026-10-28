# L3-032 — Ordered migration harness and rollback guidelines

**Scope**: pure validation and transformation of a *synthetic* V0 state/slot record into the accepted V1. There has never been a shipping legacy V0 format. We deliberately avoid claiming compatibility with historical released player saves. Future schema versions require new separately approved steps.

## Contract

- `migrateGameState(unknown)` validates a strict V0/V1 object and returns an independent frozen V1 snapshot with a frozen ordered migration trace. V1 goes through the same validator unchanged, with zero applied steps.
- `migrateManualSlotRecord(unknown)` validates a slot envelope containing exactly `metadata` and `state`; its metadata has exactly five existing accepted fields. The metadata/state versions must match. V0→V1 changes **only** `schemaVersion` on both objects and leaves career/fighter identities, game calendar, fight elapsed milliseconds, random algorithm, seed, word, draws, `slotId`, and `savedAtEpochMs` unchanged.
- `ORDERED_MIGRATION_STEPS` is an immutable ordered `0→1` registry. No speculative V2 handler exists. Future/negative/fractional/unknown versions, extra fields, incorrect RNG integrity, invalid metadata, mismatched versions, accessors and malformed input fail closed with explicit codes.
- No reads, writes, file operations, migrations on startup, or silent overwrites. Existing save data never changes merely because the harness ran. There is no automatic migration of IndexedDB or export/archive formats.

## Safe operator procedure and rollback

1. Preserve the exact source version and all existing IndexedDB/manual slot data; **never overwrite a user's only valid save**.
2. Run the pure migration on a separate parsed copy. If it fails, stop and retain the original. Do not patch or coerce malformed values.
3. Validate the resulting V1 via the existing validator; record version trace, source and destination slot, and hashes of both copies outside the domain module.
4. For actual persistence, require explicit user authorization for an otherwise occupied destination. Use L3-030/031 atomic slot import/commit or an isolated empty slot. Confirm transaction commit and read back all values after reload.
5. If interrupted, rollback means retain the prior source snapshot and leave the destination untouched. If a write fails or verification differs, restore the preserved backup using an explicit separately verified write, never a silent runtime repair.
6. An upgrade path for a real future V2 will require its own accepted specification, V1/V2 fixtures and automatic backup guarantees. **L3-033 and subsequent features are not implemented here.**

## Acceptance

20 pure Node tests, six intentional TypeScript diagnostics, strict typecheck, lint/domain boundaries, genuine Vite build, real Chromium at 375/390/402/430 CSS px in dev+preview with reload and prior-save survival. All L3-020–031 workflows must remain successful. Physical iPhone Safari remains NOT_RUN unless tested on hardware. No gameplay or player-facing migration menu.
