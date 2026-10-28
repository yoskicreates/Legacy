/** L3-025 compile-only type contract; never executed by game UI. */
import {
  RANDOM_ALGORITHM,
  createRandomSource, nextRandomUint32, nextRandomUnitInterval,
  type RandomSourceState, type RandomSourceStep,
} from '@domain/core';

const algorithm: 'LEGACY3-MULBERRY32-V1' = RANDOM_ALGORITHM;
const seed: RandomSourceState = createRandomSource(12);
const result: RandomSourceStep = nextRandomUint32(seed);
const fraction: RandomSourceStep = nextRandomUnitInterval(result.state);
const uint32: number = result.value;
const draws: number = fraction.state.draws;
void algorithm;
void uint32;
void draws;

// @ts-expect-error: seed must be numeric, not text
createRandomSource('12');
// @ts-expect-error: implicit unseeded sources are prohibited
createRandomSource();
// @ts-expect-error: seed cannot be reassigned after creation
seed.seed = 2;
// @ts-expect-error: stream advancement must produce a new snapshot
result.state.draws = 0;
// @ts-expect-error: incomplete source objects must not typecheck
nextRandomUint32({ seed: 1, draws: 0 });
// @ts-expect-error: output is a numeric sample
const wrongValue: string = result.value;
void wrongValue;
