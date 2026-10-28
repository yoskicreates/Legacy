/** L3-027 deliberately invalid assignments — must produce >=5 diagnostics. */
import type { GameStateV1 } from '../../src/domain/core/state-schema';
const valid: GameStateV1 = {
  schemaVersion: 1,
  career: { careerId: 'career-1', fighterId: 'fighter-1' },
  clocks: { calendar: { dayIndex: 0 }, fight: { elapsedMilliseconds: 0 } },
  random: { algorithm: 'LEGACY3-MULBERRY32-V1', seed: 1, word: 1, draws: 0 },
};
// SCHEMA-NEG-01: unsupported version
const future: GameStateV1 = { ...valid, schemaVersion: 2 };
// SCHEMA-NEG-02: absent essential clocks field
const missing: GameStateV1 = { schemaVersion: 1, career: valid.career, random: valid.random };
// SCHEMA-NEG-03: incompatible random algorithm
const algo: GameStateV1 = { ...valid, random: { ...valid.random, algorithm: 'OTHER' } };
// SCHEMA-NEG-04: invalid clock type
const clock: GameStateV1 = { ...valid, clocks: { calendar: { dayIndex: 'today' }, fight: { elapsedMilliseconds: 0 } } };
// SCHEMA-NEG-05: readonly state mutation
valid.schemaVersion = 1;
void future; void missing; void algo; void clock;
