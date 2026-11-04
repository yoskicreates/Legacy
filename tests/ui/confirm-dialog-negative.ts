/** L3-043: exactly eight intentionally invalid public API contracts. */
import type {ConfirmDialogProps, ConfirmationIntent} from '../../src/ui/confirm-dialog-contract';
const invalidIntent:ConfirmationIntent='warning';
const invalidOpen:ConfirmDialogProps={open:'yes',title:'Review',message:'Proceed?',confirmText:'Confirm',onConfirm:()=>{},onCancel:()=>{}};
const invalidConfirmLabel:ConfirmDialogProps={open:true,title:'Review',message:'Proceed?',confirmText:42,onConfirm:()=>{},onCancel:()=>{}};
const invalidCancelLabel:ConfirmDialogProps={open:true,title:'Review',message:'Proceed?',confirmText:'Confirm',cancelText:false,onConfirm:()=>{},onCancel:()=>{}};
const missingConfirmCallback:ConfirmDialogProps={open:true,title:'Review',message:'Proceed?',confirmText:'Confirm',onCancel:()=>{}};
const missingCancelCallback:ConfirmDialogProps={open:true,title:'Review',message:'Proceed?',confirmText:'Confirm',onConfirm:()=>{}};
const invalidCallbackType:ConfirmDialogProps={open:true,title:'Review',message:'Proceed?',confirmText:'Confirm',onConfirm:123,onCancel:()=>{}};
const invalidCancelSignature:ConfirmDialogProps={open:true,title:'Review',message:'Proceed?',confirmText:'Confirm',onConfirm:()=>{},onCancel:(reason:string)=>{void reason;}};
void [invalidIntent,invalidOpen,invalidConfirmLabel,invalidCancelLabel,missingConfirmCallback,missingCancelCallback,invalidCallbackType,invalidCancelSignature];
