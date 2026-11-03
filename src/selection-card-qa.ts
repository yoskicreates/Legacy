/** Isolated L3-042 production Preact gallery entry; never mounts the fight renderer. */
import {h,render} from 'preact';
import {SelectionCardGallery} from './ui/selection-card';
const host=document.getElementById('selection-card-root');
if(!host)throw new Error('Missing L3-042 selection-card preview host');
render(h(SelectionCardGallery,{}),host);
document.documentElement.dataset.selectionCardReady='true';
