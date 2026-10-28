/** The compiler MUST reject all intentionally invalid autosave types. */
import type { IndexedDbWriteOptions } from '../../src/domain/persistence/indexeddb';
import type { AutosaveReceipt } from '../../src/domain/persistence/autosave';
import { autosaveGameState } from '../../src/domain/persistence/autosave';
import type { GameStateV1 } from '../../src/domain/core';

const notSignal: IndexedDbWriteOptions = { signal: 'abort' };
const badVersion: AutosaveReceipt = { committed: true, schemaVersion: 2 };
const falseCommit: AutosaveReceipt = { committed: false, schemaVersion: 1 };
const wrongState: GameStateV1 = { schemaVersion: 3 };
const mistakenReturn: Promise<GameStateV1> = autosaveGameState(null);
void [notSignal, badVersion, falseCommit, wrongState, mistakenReturn];
