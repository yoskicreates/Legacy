import { assertBottomTab, routeForTab, type BottomTabId, type TabDefinition } from '../../src/ui/bottom-nav-contract';
const impossible: BottomTabId = 'arena';
const missing: BottomTabId = 'home';
const badRoute: TabDefinition = {id:'career',label:'Career',icon:'◉',route:'arena',eyebrow:'x',title:'y',description:'z'};
const noLabel: TabDefinition = {id:'fight',icon:'◉',route:'fight',eyebrow:'x',title:'y',description:'z'};
routeForTab('home');
assertBottomTab(5);
const badId: BottomTabId = 123;
void [impossible,missing,badRoute,noLabel,badId];
