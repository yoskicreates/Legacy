# L3-026 — Typed domain event contracts

**Task:** L3-026, Phase 02 — Project architecture and saving  
**Source dependency:** completed L3-025; 272-task Master Blueprint and L3-016 Task Acceptance Contract.  
**Acceptance criterion:** Invalid event payloads must be rejected by strict TypeScript compilation.  
**Acceptance:** type contract and 8 dedicated tests PASS in GitHub Actions run 40779088803; full checkpoint CRC/SHA-256 verified separately before merge.

## Exact events

The `@domain/core` public type exports live in `src/domain/core/events.ts` and `src/domain/core/index.ts`. The event schema is a compile-time **discriminated union**, with `eventId`, exact event `type` and correlated typed `payload` required. The four defined event contracts are:

| Type | Required payload fields | Interpretation |
| --- | --- | --- |
| `fight.recorded` | `fightId`, `fighterId`, `opponentId` | Neutral reference to a recorded fight; no outcome or scoring rules |
| `training.recorded` | `sessionId`, `fighterId` | Neutral reference to training; no energy or skill gains |
| `purchase.recorded` | `purchaseId`, `buyerId` | Neutral purchase reference; no price, charges or balances |
| `relationship.recorded` | `relationshipId`, `participantId`, `counterpartyId` | Neutral interaction reference; no affinity, scandal or romance calculations |

The API exports `DomainEventPayloads`, `DomainEventType`, `DomainEventOf<T>`, and the exhaustively narrowable `DomainEvent` union. It deliberately contains **types only**, so there is no event emitter, queue, clock coupling, RNG, storage, UI integration, event delivery, or event processing. TypeScript readonly properties are **compile-time only**, not runtime payload validation or a promise of immutability after untrusted JSON parsing. The next schema task, L3-027, remains unimplemented.

## Verification and traceability

- **AC-01:** Each of the four event kinds exists with exactly the required payload fields (AST unit test).
- **AC-02:** Valid type-specific payloads and exhaustive discriminated-union narrowing pass `npm run typecheck:events`.
- **AC-03:** Six deliberately invalid TypeScript declarations are rejected by `tsconfig.events-negative.json` and the headless `tests/domain-events.test.mjs` suite. Positive and intentionally failing fixture are independently compiled.
- **AC-04:** Core domain import boundaries remain enforced; no new runtime dependencies or cross-domain feature imports.
- **AC-05:** Existing strict TypeScript, negative fixture, lint, Node tests, Vite build, genuine server and Chromium regression tests remain passing.
- **AC-06:** Verify latest immutable parent checkpoint and complete historical Git objects, new ZIP CRC/manifest SHA-256, task report, and final task register; do not mark complete until verified.

**Decisions respected:** DEC-006 (no in-round controls), DEC-007 (approved round length/playback but no engine in this task), DEC-009 and DEC-014 (no premium energy or pay-to-progress), DEC-015 (reject manual in-round commands). **Still OPEN:** DEC-030 (calendar progression), DEC-031 (fight outcome/scoring), DEC-032 (currency/balance), DEC-035 (dangerous events/scandals). This task does not choose or implement any OPEN decision.

**Excluded:** result calculation, paid energy, combat simulation, training benefits, purchases, relationship state, RNG consumption, timestamps, saving, runtime validation, routing changes, UI artwork, L3-027 state schema. Physical iPhone Safari testing is `NOT_RUN` and must never be called passing.
