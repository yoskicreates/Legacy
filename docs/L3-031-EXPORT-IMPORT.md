# LEGACY 3.0 L3-031 — Verified portable manual career archives

Task L3-031 implements only validated export/import of one previously saved V1 manual career slot, using L3-027 through L3-030 contracts. This milestone does **not** implement browser file download/upload buttons, save UI, autosave scheduling, L3-032 migrations, or gameplay. Save data remains client-local; a copied archive is portable JSON text, not automatic cloud synchronization.

## Archive format V1

`exportManualSlot('slot-1')` produces deterministic UTF-8 JSON with a `body` of exactly four keys: `format: LEGACY3_CAREER_ARCHIVE`, `archiveVersion: 1`, five-field manual slot `metadata`, and full V1 `state`. A second `checksum` object has `algorithm: SHA-256` and lowercase 64-hex-character `hex`. The hash covers the canonical JSON serialization of the body, with stable field ordering and every accepted V1 state field. SHA-256 is an integrity check, **not a digital signature or authentication**: a malicious actor can edit a save and recompute its checksum. It detects accidental corruption; no secrecy or anti-cheat guarantee is claimed. Archive text is bounded at 128 KiB before JSON parsing.

`importManualSlot(targetSlotId, archiveText)` checks exact envelope keys, identifier/slot metadata, source and destination schema versions, state invariants, checksum algorithm and SHA-256 digest *before opening IndexedDB*. Unknown or unsupported versions **fail closed**; no migrations or silent state adjustment are performed. Default behavior refuses to overwrite occupied destinations with `SLOT_OCCUPIED`. An explicit `{overwrite:true}` authorizes a replacement, with a same-transaction read/conditional put to avoid racing with other writers. If validation, storage, quota, cancellation or transaction commit fails, the earlier committed target remains intact. A successful result means the transaction completed, not merely that a write was queued. Imported saves retain the original timestamp, IDs, clocks and RNG seed/word/draws; the only intended metadata difference when changing slots is `slotId` becoming the explicit target slot.

The archive has no external service dependencies beyond Web Crypto's SHA-256 implementation and browser IndexedDB; unavailability is a typed failure. No personal data are sent to a server by the module. A browser may still clear its local storage, so a valid external archive is recommended for user-controlled backups when a future UI exists.

## Acceptance requirements and evidence

- EI-1: Deterministic archive and exact SHA-256 checksum; repeated exports identical.
- EI-2: Explicit source metadata and full state round trip, including both clocks, random seed/word/draw count, and original timestamp.
- EI-3: Reject malformed/oversized/unknown versions, extra fields, invalid metadata, corrupted state, or checksum mismatch before any DB write.
- EI-4: Refuse existing slot writes without explicit permission, atomic compare-then-commit on import; aborted writes and failed imports preserve prior records.
- EI-5: Two independent careers remain intact through import/restore and full browser reload at 375/390/402/430 px in both real Vite dev/preview Chromium servers.
- EI-6: All previous L3-020–L3-030 tests, genuine Vite build, no new gameplay or migration work, archive CRC and history check PASS.

**Actual iPhone Safari remains NOT_RUN** without an attached physical iPhone. Cloud Chromium emulation is not a substitute. Implementation source is `src/domain/persistence/export-import.ts` with one intentional L3-031 scoped atomic-write extension in `manual-slots.ts`. Test harnesses are not accessible in the player-facing UI.
