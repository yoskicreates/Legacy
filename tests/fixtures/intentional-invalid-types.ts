/** Deliberately invalid sample. Included ONLY by tsconfig.negative.json. */
import type { CompileTimeGameMarker } from '@game/contracts';

// Must fail strictNullChecks: null cannot satisfy nonnullable string.
export const badNull: string = null;

// Must fail noImplicitAny: argument has no inferred type.
export function badImplicitAny(value) { return value; }

// Must fail literal and readonly object compatibility.
export const badMarker: CompileTimeGameMarker = { milestone: 'wrong', foundationOnly: true };
