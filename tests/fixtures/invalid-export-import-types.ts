import { exportManualSlot, importManualSlot } from '@domain/persistence/export-import';
import type { CareerImportOptions, CareerImportReceipt } from '@domain/persistence/export-import';
const slot: Parameters<typeof exportManualSlot>[0]='slot-9';
const archive: Parameters<typeof importManualSlot>[1]=123;
const options: CareerImportOptions={overwrite:'yes'};
const result: CareerImportReceipt={sourceSlotId:'slot-1',targetSlotId:'slot-2',metadata:{slotId:'slot-2',savedAtEpochMs:0,careerId:'a',fighterId:'b',schemaVersion:2},checksum:'a'};
const bad = importManualSlot('slot-1',{},{});
void slot;void archive;void options;void result;void bad;
