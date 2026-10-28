import { migrateGameState, migrateManualSlotRecord, ORDERED_MIGRATION_STEPS } from '@domain/persistence/migrations';
import type { MigrationResult, MigrationStep } from '@domain/persistence/migrations';
import type { GameStateV1 } from '@domain/core';
const result: MigrationResult<GameStateV1> = migrateGameState({ schemaVersion: 0 });
const record = migrateManualSlotRecord({metadata: {},state: {}});
const step: MigrationStep = ORDERED_MIGRATION_STEPS[0]!;
void result; void record; void step;
