/** L3-027 positive type contract; not mounted by UI or persistence. */
import {
  GAME_STATE_SCHEMA_VERSION, GAME_STATE_RANDOM_ALGORITHM, validateGameState,
  type GameStateV1, type GameStateValidationResult,
} from '@domain/core';
const state: GameStateV1 = {
  schemaVersion: GAME_STATE_SCHEMA_VERSION,
  career: { careerId: 'career-1', fighterId: 'fighter-1' },
  clocks: { calendar: { dayIndex: 5 }, fight: { elapsedMilliseconds: 5000 } },
  random: { algorithm: GAME_STATE_RANDOM_ALGORITHM, seed: 7, word: 7, draws: 0 },
};
const result: GameStateValidationResult = validateGameState(state);
if (result.ok) {
  const version: 1 = result.state.schemaVersion;
  void version;
} else {
  const path: string = result.path;
  void path;
}
void state;
