/** L3-022 economy domain boundary: declaration only, no gameplay or persistence behavior. */
import type { DomainBoundary } from '@domain/core';

export const economyBoundary: DomainBoundary<'economy'> = Object.freeze({
  id: 'economy',
  status: 'contracts-only',
  hasRuntimeSimulation: false,
});
