/** L3-044: truthful notices derived from completed outcomes, never a claim about an attempted save. */
export type ToastEvent =
  | {readonly type:'practice-complete';readonly action:'choice'|'confirmation'}
  | {readonly type:'preview-error'}
  | {readonly type:'preview-locked'}
  | {readonly type:'preview-save'}
  | {readonly type:'save-committed';readonly receipt:{readonly persisted:true;readonly destination:'device'|'export';readonly receiptId:string}}
  | {readonly type:'save-failed';readonly reason:'storage-unavailable'|'write-failed'|'quota-exceeded'}
  | {readonly type:'feature-locked';readonly featureName:string};
export type ToastAppearance='success'|'error'|'locked'|'saved'|'preview-saved';
export interface ToastNotice {
  readonly id:string;
  readonly appearance:ToastAppearance;
  readonly title:string;
  readonly detail:string;
  readonly urgency:'polite'|'assertive';
  readonly previewOnly:boolean;
}
const COPY={
  practiceChoice:'Practice choice selected',
  practiceConfirm:'Practice confirmation completed',
  errorTitle:'Error example only',
  lockedTitle:'Locked state example',
  savedTitle:'Saved state preview',
} as const;
/** A completed save receipt must be supplied by a real persistence result. This UI does no storage writes. */
export function makeToastNotice(id:string,event:ToastEvent):ToastNotice {
  if(!id.trim())throw new RangeError('Toast ID must be non-empty');
  switch(event.type){
    case 'practice-complete':return {id,appearance:'success',title:event.action==='choice'?COPY.practiceChoice:COPY.practiceConfirm,
      detail:'This practice action completed in the preview. No game progress was saved.',urgency:'polite',previewOnly:true};
    case 'preview-error':return {id,appearance:'error',title:COPY.errorTitle,
      detail:'This demonstrates an error notification. No real operation failed or data changed.',urgency:'assertive',previewOnly:true};
    case 'preview-locked':return {id,appearance:'locked',title:COPY.lockedTitle,
      detail:'This option is unavailable in the demonstration. Your game remains unchanged.',urgency:'polite',previewOnly:true};
    case 'preview-save':return {id,appearance:'preview-saved',title:COPY.savedTitle,
      detail:'Example appearance only: nothing was written to a save slot or device.',urgency:'polite',previewOnly:true};
    case 'save-committed':{
      const receipt=event.receipt;
      if(!receipt||receipt.persisted!==true||!receipt.receiptId?.trim()||!['device','export'].includes(receipt.destination))
        throw new RangeError('A completed write receipt is required before showing Saved');
      return {id,appearance:'saved',title:receipt.destination==='device'?'Saved on this device':'Save file exported',
        detail:receipt.destination==='device'?'The local save operation completed successfully.':'The save file export completed successfully.',
        urgency:'polite',previewOnly:false};
    }
    case 'save-failed':return {id,appearance:'error',title:'Save did not complete',
      detail:event.reason==='quota-exceeded'?'Storage is full. No successful save was confirmed.':
        event.reason==='storage-unavailable'?'Local storage is unavailable. No successful save was confirmed.':
        'The write failed. No successful save was confirmed.',urgency:'assertive',previewOnly:false};
    case 'feature-locked':{
      if(!event.featureName.trim())throw new RangeError('Locked feature needs a name');
      return {id,appearance:'locked',title:'Feature unavailable',
        detail:`${event.featureName} is not available yet. No action was performed.`,urgency:'polite',previewOnly:false};
    }
  }
}
