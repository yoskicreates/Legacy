/** L3-028 strict storage contracts are checked without performing browser I/O. */
import { readGameState, writeGameState, type IndexedDbOptions, type IndexedDbResult } from '@domain/persistence/indexeddb';
import type { GameStateV1 } from '@domain/core';
const options: IndexedDbOptions = { databaseName: 'L3-028-type-smoke' };
const reader: Promise<IndexedDbResult<GameStateV1 | null>> = readGameState(options);
const writer: Promise<IndexedDbResult<true>> = writeGameState({ schemaVersion: 999 });
void options;
void reader;
void writer;
