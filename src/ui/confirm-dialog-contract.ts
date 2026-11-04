/** L3-043 — typed contract for a presentation-only irreversible action confirmation. */
export const CONFIRM_DIALOG_VERSION='L3-043.V1' as const;
export type ConfirmationIntent='standard'|'danger';
export interface ConfirmDialogProps {
  readonly open:boolean;
  readonly title:string;
  readonly message:string;
  readonly confirmText:string;
  readonly cancelText?:string;
  readonly intent?:ConfirmationIntent;
  readonly onConfirm:()=>void;
  readonly onCancel:()=>void;
}
export function validateConfirmDialog({title,message,confirmText,cancelText='Cancel',intent='standard'}:ConfirmDialogProps):true {
  if(!title.trim()||!message.trim()||!confirmText.trim()||!cancelText.trim())throw new RangeError('Confirmation dialog requires a title, message, confirm and cancel labels');
  if(intent!=='standard'&&intent!=='danger')throw new RangeError('Unsupported confirmation intent');
  return true;
}
