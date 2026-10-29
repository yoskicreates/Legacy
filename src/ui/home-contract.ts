/** L3-038: typed, non-playable home/menu preview contract. No storage or gameplay. */
export const HOME_VERSION = 'L3-038.V1' as const;
export const HOME_VIEWS = ['home', 'start', 'continue', 'settings'] as const;
export type HomeView = (typeof HOME_VIEWS)[number];
export type HomeAction = Exclude<HomeView, 'home'>;
export type HomeActionDefinition = Readonly<{
  id: HomeAction;
  label: string;
  eyebrow: string;
  description: string;
}>;
export const HOME_ACTIONS: readonly HomeActionDefinition[] = Object.freeze([
  Object.freeze({ id: 'start', label: 'Start Career', eyebrow: 'YOUR NEXT CHAPTER', description: 'Explore the upcoming career creator.' }),
  Object.freeze({ id: 'continue', label: 'Continue', eyebrow: 'RETURN TO YOUR STORY', description: 'Preview the future career-resume entry.' }),
  Object.freeze({ id: 'settings', label: 'Settings', eyebrow: 'MAKE IT YOURS', description: 'View current display and accessibility foundations.' }),
]);
export const HOME_PANELS: Readonly<Record<HomeAction, Readonly<{title:string;body:string;note:string}>>> = Object.freeze({
  start: Object.freeze({ title: 'Your story begins here.', body: 'Career creation is scheduled for a future milestone. No fighter or save has been created.', note: 'VISUAL PREVIEW ONLY' }),
  continue: Object.freeze({ title: 'Your career, when it is ready.', body: 'Career loading is not connected to the home screen in this milestone. No saved state is read or modified.', note: 'RESUME UNAVAILABLE IN THIS BUILD' }),
  settings: Object.freeze({ title: 'Designed for your screen.', body: 'Midnight navy, warm gold, responsive typography, and iPhone safe-area padding are active. Editable preferences come later.', note: 'DISPLAY FOUNDATION ONLY' }),
});
export function assertHomeView(value: string): HomeView {
  if (!(HOME_VIEWS as readonly string[]).includes(value)) throw new Error('Unknown home preview view');
  return value as HomeView;
}
export function homePanel(view: HomeAction) { return HOME_PANELS[view]; }
