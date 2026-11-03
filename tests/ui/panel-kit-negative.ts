import {TextCard,StatPanel,ActionTile,PanelList} from '../../src/ui/panel-kit';
import {assertPanelKitContrast, type PanelKitTheme, type PanelKitId} from '../../src/ui/panel-kit-contract';
TextCard({title:12,body:'Preview'}); // TS2322
TextCard({title:'Preview',body:12}); // TS2322
StatPanel({label:'Rating',value:9}); // TS2322
ActionTile({label:'Preview',description:'Text',onActivate:'bad'}); // TS2322
ActionTile({label:'Preview',description:'Text',onActivate:()=>{},disabled:'false'}); // TS2322
PanelList({title:'Preview',items:[{id:'one',label:123}]}); // TS2322
const wrong:PanelKitTheme='sepia'; // TS2322
const wrongId:PanelKitId='slider'; // TS2322
void [wrong,wrongId,assertPanelKitContrast];
