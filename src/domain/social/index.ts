/** L3-022 social domain boundary: declaration only, no gameplay or persistence behavior. */
import type { DomainBoundary } from '@domain/core';

export const socialBoundary: DomainBoundary<'social'> = Object.freeze({
  id: 'social',
  status: 'contracts-only',
  hasRuntimeSimulation: false,
});
