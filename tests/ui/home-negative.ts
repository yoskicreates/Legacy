import { type HomeAction, type HomeView, assertHomeView, homePanel, type HomeActionDefinition } from '../../src/ui/home-contract';
const invalidAction: HomeAction = 'home';
const invalidView: HomeView = 'fight';
const invalidCase: HomeView = 'Start';
const missingProps: HomeActionDefinition = { id: 'start', label: 'Start' };
const wrongId: HomeActionDefinition = { id: 'career', label: 'Career', eyebrow: 'X', description: 'x' };
homePanel('home');
const wrongString: number = assertHomeView('home');
void [invalidAction, invalidView, invalidCase, missingProps, wrongId, wrongString];
