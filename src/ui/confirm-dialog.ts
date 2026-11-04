/** L3-043 — accessible native modal; presentation only, never writes game state. */
import {h} from 'preact';
import {useId,useLayoutEffect,useRef,useState} from 'preact/hooks';
import {validateConfirmDialog} from './confirm-dialog-contract';
import type {ConfirmDialogProps} from './confirm-dialog-contract';

export function ConfirmDialog(props:ConfirmDialogProps) {
  validateConfirmDialog(props);
  const dialogRef=useRef<HTMLDialogElement>(null);
  const cancelRef=useRef<HTMLButtonElement>(null);
  const consumedRef=useRef(false);
  const headingId=useId(),messageId=useId();
  useLayoutEffect(()=>{
    const dialog=dialogRef.current;
    if(!dialog)return;
    if(props.open){
      consumedRef.current=false;
      if(!dialog.open)dialog.showModal();
      cancelRef.current?.focus();
    } else if(dialog.open){dialog.close();}
    return ()=>{if(dialog.open)dialog.close();};
  },[props.open]);
  function confirm(){
    if(consumedRef.current||!props.open)return;
    consumedRef.current=true;
    props.onConfirm();
  }
  function cancel(){
    if(consumedRef.current||!props.open)return;
    consumedRef.current=true;
    props.onCancel();
  }
  return h('dialog',{ref:dialogRef,class:`legacy-confirm-modal legacy-confirm-modal--${props.intent??'standard'}`,
    role:'dialog','aria-modal':'true','aria-labelledby':headingId,'aria-describedby':messageId,
    'data-confirm-modal':'true',onCancel:(event:Event)=>{event.preventDefault();cancel();}},[
    h('div',{class:'legacy-confirm-body'},[
      h('span',{class:'legacy-kit-eyebrow'},'LEGACY 3.0 · CONFIRMATION'),
      h('h2',{id:headingId,class:'legacy-confirm-heading'},props.title),
      h('p',{id:messageId,class:'legacy-kit-description'},props.message),
      h('div',{class:'legacy-confirm-actions'},[
        h('button',{ref:cancelRef,class:'legacy-confirm-cancel',type:'button',onClick:cancel},props.cancelText??'Cancel'),
        h('button',{class:'legacy-confirm-accept',type:'button','data-confirm-accept':'true',onClick:confirm},props.confirmText),
      ]),
    ]),
  ]);
}

/** Preview callbacks record choices only within this isolated page, never in game saves. */
export function ConfirmDialogGallery() {
  const [theme,setTheme]=useState<'dark'|'light'>('dark');
  const [open,setOpen]=useState(false);
  const [kind,setKind]=useState<'standard'|'danger'>('standard');
  const [confirmed,setConfirmed]=useState(0);
  const [cancelled,setCancelled]=useState(0);
  const openDialog=(next:'standard'|'danger')=>{setKind(next);setOpen(true);};
  return h('main',{class:'legacy-kit legacy-confirm-gallery','data-kit-theme':theme,'data-confirm-gallery':'L3-043'},[
    h('header',{class:'legacy-kit-header'},[
      h('span',{class:'legacy-kit-eyebrow'},'LEGACY 3.0 / L3-043 PREVIEW'),
      h('h1',{},'Confirmation pop-ups'),
      h('p',{class:'legacy-kit-description'},'Practice confirmations. Cancel changes nothing. Confirm only adds to the preview counter, never game data.'),
      h('div',{class:'legacy-kit-theme-switch',role:'group','aria-label':'Preview appearance'},(['dark','light'] as const).map(t=>
        h('button',{type:'button',key:t,'aria-pressed':theme===t,onClick:()=>setTheme(t)},t==='dark'?'Dark preview':'Light preview'))),
    ]),
    h('div',{class:'legacy-confirm-container'},[
      h('button',{type:'button',class:'legacy-confirm-launch',onClick:()=>openDialog('standard')},'Open regular confirmation'),
      h('button',{type:'button',class:'legacy-confirm-launch legacy-confirm-launch--danger',onClick:()=>openDialog('danger')},'Open irreversible-action warning'),
      h('p',{class:'legacy-confirm-feedback',role:'status','aria-live':'polite','data-confirm-counter':'true'},
        `Preview-only confirmations: ${confirmed}. Cancelled: ${cancelled}. No saved game data changed.`),
    ]),
    h(ConfirmDialog,{open,title:kind==='danger'?'Delete this preview item?':'Confirm this preview choice?',
      message:kind==='danger'?'This is a warning example. No real items will be deleted.':'This is a safe confirmation example. No gameplay changes will occur.',
      confirmText:kind==='danger'?'Confirm preview deletion':'Confirm preview',
      cancelText:'Cancel',intent:kind,
      onCancel:()=>{setOpen(false);setCancelled(v=>v+1);},
      onConfirm:()=>{setOpen(false);setConfirmed(v=>v+1);}}),
    h('p',{class:'legacy-kit-footnote'},'L3-043 component QA only · No fighter artwork, gameplay, saves or sliders'),
  ]);
}
