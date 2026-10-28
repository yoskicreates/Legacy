/** L3-022 core domain vocabulary; L3-024 adds a pure isolated clock utility. No gameplay or storage. */
export type DomainId = 'core' | 'combat' | 'career' | 'economy' | 'social' | 'persistence';

/** A declared boundary is not a functioning domain implementation. */
export interface DomainBoundary<Id extends DomainId = DomainId> {
  readonly id: Id;
  readonly status: 'contracts-only';
  readonly hasRuntimeSimulation: false;
}

export const coreBoundary: DomainBoundary<'core'> = Object.freeze({
  id: 'core',
  status: 'contracts-only',
  hasRuntimeSimulation: false,
});

/** L3-024 pure calendar/fight time state, intentionally separate from simulation. */
export { createGameClocks, reduceGameClocks } from './clock';
export type { GameCalendarClock, FightSimulationClock, GameClockState, GameClockAction } from './clock';

/** L3-025 explicit seedable random source; no ambient entropy. */
export { RANDOM_ALGORITHM, createRandomSource, nextRandomUint32, nextRandomUnitInterval } from './random';
export type { RandomSourceState, RandomSourceStep } from './random';

/** L3-026 compile-only fight, training, purchase, relationship event shapes. */
export type { DomainEvent, DomainEventOf, DomainEventPayloads, DomainEventType } from './events';

/** L3-027 strictly validated versioned core snapshot; no save I/O or migration. */
export { GAME_STATE_SCHEMA_VERSION, GAME_STATE_RANDOM_ALGORITHM, validateGameState } from './state-schema';
export type { GameStateV1, GameStateValidationCode, GameStateValidationResult } from './state-schema';
