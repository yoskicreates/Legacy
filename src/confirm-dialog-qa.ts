/** L3-043 isolated gallery: only demo counters, no game or save interaction. */
import {h,render} from 'preact';
import {ConfirmDialogGallery} from './ui/confirm-dialog';
const host=document.getElementById('confirm-dialog-root');
if(!host)throw new Error('Missing confirmation dialog preview host');
render(h(ConfirmDialogGallery,{}),host);
document.documentElement.dataset.confirmDialogReady='true';
