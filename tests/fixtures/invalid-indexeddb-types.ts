import { type IndexedDbOptions, type IndexedDbResult, writeGameState } from '../../src/domain/persistence/indexeddb';
const wrongFactory: IndexedDbOptions = { factory: 'not indexeddb' };
const wrongName: IndexedDbOptions = { databaseName: 7 };
const wrongResult: IndexedDbResult<true> = { ok: true, value: false };
const mutatingReadonly: IndexedDbOptions = {};
mutatingReadonly.databaseName = 'mutation prohibited';
const badPromise: Promise<number> = writeGameState({});
void wrongFactory; void wrongName; void wrongResult; void badPromise;
