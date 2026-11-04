/** These eight bad contracts must fail strict TypeScript checking. */
import type {ToastEvent,ToastNotice} from '../../src/ui/toast-status-contract';
// 1: no real save receipt
const noReceipt:ToastEvent={type:'save-committed'};
// 2: a failed write cannot be presented as persisted
const falseReceipt:ToastEvent={type:'save-committed',receipt:{persisted:false,destination:'device',receiptId:'fake'}};
// 3: unsupported save target
const badDestination:ToastEvent={type:'save-committed',receipt:{persisted:true,destination:'cloud',receiptId:'fake'}};
// 4: an empty save transaction cannot skip receipt ID
const missingId:ToastEvent={type:'save-committed',receipt:{persisted:true,destination:'device'}};
// 5: a practice action cannot be called a save
const fakePracticeSave:ToastEvent={type:'practice-complete',action:'save'};
// 6: not a known status event
const fakeEvent:ToastEvent={type:'saved'};
// 7: save error must have a documented failure reason
const noReason:ToastEvent={type:'save-failed'};
// 8: an unrecognized visual state is not accepted
const badAppearance:ToastNotice={id:'wrong',appearance:'fake',title:'x',detail:'y',urgency:'polite',previewOnly:true};
void [noReceipt,falseReceipt,badDestination,missingId,fakePracticeSave,fakeEvent,noReason,badAppearance];
