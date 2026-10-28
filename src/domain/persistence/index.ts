/** L3-022 persistence domain boundary: declaration only, no gameplay or persistence behavior. */
import type { DomainBoundary } from '@domain/core';

export const persistenceBoundary: DomainBoundary<'persistence'> = Object.freeze({
  id: 'persistence',
  status: 'contracts-only',
  hasRuntimeSimulation: false,
});
