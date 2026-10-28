/** L3-022 core domain vocabulary; L3-024 adds a pure isolated clock utility. No gameplay, RNG, events or storage. */
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
