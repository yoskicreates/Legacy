/** L3-045 standalone presentation fixture; never mounts real fighter career/save state. */
import {h,render} from 'preact';
import {DashboardGallery} from './ui/dashboard';
const host=document.querySelector('#dashboard-root');
if(!host)throw new Error('Missing dashboard preview host');
render(h(DashboardGallery,{}),host);
document.documentElement.dataset.dashboardReady='true';
