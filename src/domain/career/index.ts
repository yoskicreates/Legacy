/** L3-022 career domain boundary: declaration only, no gameplay or persistence behavior. */
import type { DomainBoundary } from '@domain/core';

export const careerBoundary: DomainBoundary<'career'> = Object.freeze({
  id: 'career',
  status: 'contracts-only',
  hasRuntimeSimulation: false,
});
