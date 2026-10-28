import { migrateGameState, migrateManualSlotRecord } from '@domain/persistence/migrations';
import { saveManualSlot, loadManualSlot } from '@domain/persistence/manual-slots';
const state = (id: string, schemaVersion = 0, seed = 123) => ({
  schemaVersion, career: { careerId: id, fighterId: `fighter-${id}` },
  clocks: { calendar: { dayIndex: 170 }, fight: { elapsedMilliseconds: 8000 } },
  random: { algorithm: 'LEGACY3-MULBERRY32-V1', seed, word: seed, draws: 0 },
});
const slotRecord = (slotId: string, id: string, savedAtEpochMs: number, schemaVersion = 0) => ({
  metadata: { slotId, savedAtEpochMs, careerId: id, fighterId: `fighter-${id}`, schemaVersion },
  state: state(id, schemaVersion),
});
declare global { interface Window { __LEGACY3_MIGRATIONS_QA__?: unknown } }
window.__LEGACY3_MIGRATIONS_QA__ = {migrateGameState,migrateManualSlotRecord,saveManualSlot,loadManualSlot,state,slotRecord};
document.documentElement.dataset.migrationQaReady = 'true';
