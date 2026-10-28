import { MANUAL_SAVE_SLOT_IDS, saveManualSlot, loadManualSlot, listManualSlots } from '@domain/persistence/manual-slots';
import type { ManualSaveSlotId, ManualSlotMetadata } from '@domain/persistence/manual-slots';
const slot: ManualSaveSlotId = MANUAL_SAVE_SLOT_IDS[0];
const save: ReturnType<typeof saveManualSlot> = saveManualSlot(slot, {}, 0, { factory: null });
const load: ReturnType<typeof loadManualSlot> = loadManualSlot(slot, { factory: null });
const list: ReturnType<typeof listManualSlots> = listManualSlots({ factory: null });
void save; void load; void list;
const metadata: ManualSlotMetadata = {slotId: slot, savedAtEpochMs: 0, careerId: 'a', fighterId: 'b', schemaVersion: 1};
void metadata;
