import type { ManualSaveSlotId, ManualSlotMetadata } from '@domain/persistence/manual-slots';
import { saveManualSlot } from '@domain/persistence/manual-slots';
const wrongId: ManualSaveSlotId = 'slot-4';
const wrongTime: ManualSlotMetadata['savedAtEpochMs'] = 'yesterday';
const wrongVersion: ManualSlotMetadata['schemaVersion'] = 2;
const wrongResult: Promise<string> = saveManualSlot('slot-1', {}, 2);
const wrongFunction = saveManualSlot('slot-99', {}, 0);
void wrongId; void wrongTime; void wrongVersion; void wrongResult; void wrongFunction;
