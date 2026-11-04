/** L3-044 isolated preview, not live gameplay. */
import {h,render} from 'preact';
import {ToastStatusGallery} from './ui/toast-status';
const host=document.getElementById('toast-status-root');
if(!host)throw new Error('Missing toast status preview host');
render(h(ToastStatusGallery,{}),host);
document.documentElement.dataset.toastStatusReady='true';
