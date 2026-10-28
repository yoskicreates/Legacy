/** Tests @game/* mapping and strict compile; not imported by a browser entry point. */
import type { CompileTimeGameMarker } from '@game/contracts';

export const typecheckMarker: CompileTimeGameMarker = {
  milestone: 'L3-019',
  foundationOnly: true,
};
