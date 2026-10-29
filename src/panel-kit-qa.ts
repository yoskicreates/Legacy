/** L3-041 public, standalone visual preview — independent from gameplay and PixiJS. */
import {h,render} from 'preact';
import {PanelKitGallery} from './ui/panel-kit';
const host=document.getElementById('panel-kit-root');
if(!host)throw new Error('Missing L3-041 kit preview host');
render(h(PanelKitGallery,{}),host);
document.documentElement.dataset.panelKitReady='true';
