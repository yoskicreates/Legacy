import { CAREER_ARCHIVE_VERSION, exportManualSlot, importManualSlot } from '@domain/persistence/export-import';
import type { CareerImportOptions, CareerImportReceipt } from '@domain/persistence/export-import';
const v:typeof CAREER_ARCHIVE_VERSION=1;
const options:CareerImportOptions={overwrite:false,factory:null};
const exported:ReturnType<typeof exportManualSlot>=exportManualSlot('slot-1',options);
const imported:ReturnType<typeof importManualSlot>=importManualSlot('slot-2','{}',options);
const receipt:CareerImportReceipt={sourceSlotId:'slot-1',targetSlotId:'slot-2',metadata:{slotId:'slot-2',savedAtEpochMs:0,careerId:'a',fighterId:'b',schemaVersion:1},checksum:'a'};
void v;void exported;void imported;void receipt;
