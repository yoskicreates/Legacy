/** L3-022 shared domain vocabulary only; no clock, RNG, events, or runtime game logic. */
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
