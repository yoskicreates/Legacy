/** L3-048 S01 settings contracts: discrete choices only; no sliders or saved-game mutation. */
export type AudioChoice='on'|'off';
export type MotionChoice='full'|'reduced';
export type TextSizeChoice='normal'|'large'|'largest';
export interface SettingsPreferences {
 readonly audio:AudioChoice;
 readonly motion:MotionChoice;
 readonly textSize:TextSizeChoice;
}
export const SETTINGS_STORAGE_KEY='legacy3.settings.v1';
export const DEFAULT_SETTINGS:SettingsPreferences=Object.freeze({audio:'on',motion:'full',textSize:'normal'});
export function isSettingsPreferences(value:unknown):value is SettingsPreferences {
 if(typeof value!=='object'||value===null)return false;
 const v=value as Record<string,unknown>;
 return (v.audio==='on'||v.audio==='off')&&(v.motion==='full'||v.motion==='reduced')&&(v.textSize==='normal'||v.textSize==='large'||v.textSize==='largest');
}
export function parseSettings(value:string|null):SettingsPreferences {
 if(value===null)return DEFAULT_SETTINGS;
 try {const parsed:unknown=JSON.parse(value);return isSettingsPreferences(parsed)?parsed:DEFAULT_SETTINGS;}
 catch{return DEFAULT_SETTINGS;}
}
export function serializeSettings(value:SettingsPreferences):string {
 if(!isSettingsPreferences(value))throw new TypeError('Invalid settings');
 return JSON.stringify({audio:value.audio,motion:value.motion,textSize:value.textSize});
}
export function textScale(choice:TextSizeChoice):number {
 switch(choice){case 'normal':return 1;case 'large':return 1.125;case 'largest':return 1.25;}
}
