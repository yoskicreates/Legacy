/** L3-022 combat domain boundary: declaration only, no gameplay or persistence behavior. */
import type { DomainBoundary } from '@domain/core';

export const combatBoundary: DomainBoundary<'combat'> = Object.freeze({
  id: 'combat',
  status: 'contracts-only',
  hasRuntimeSimulation: false,
});
