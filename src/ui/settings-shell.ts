/** L3-048 settings shell: independent user preferences, never mutates career saves. */
import {h} from 'preact';
import {useEffect,useState} from 'preact/hooks';
import {DEFAULT_SETTINGS,parseSettings,serializeSettings,SETTINGS_STORAGE_KEY,textScale} from './settings-contract';
import type {SettingsPreferences} from './settings-contract';
type StorageLike=Pick<Storage,'getItem'|'setItem'>;
function defaultStorage():StorageLike|undefined {
 try{return typeof window==='undefined'?undefined:window.localStorage;}
 catch{return undefined;}
}
function read(storage:StorageLike|undefined):SettingsPreferences {
 try{return parseSettings(storage?.getItem(SETTINGS_STORAGE_KEY)??null);}catch{return DEFAULT_SETTINGS;}
}
function persist(storage:StorageLike|undefined,preferences:SettingsPreferences):boolean {
 try{storage?.setItem(SETTINGS_STORAGE_KEY,serializeSettings(preferences));return !!storage;}catch{return false;}
}
function exportSettings(preferences:SettingsPreferences):void {
 const blob=new Blob([JSON.stringify({schema:'legacy3.settings.v1',preferences},null,2)+'\n'],{type:'application/json'});
 const url=URL.createObjectURL(blob);
 try{const a=document.createElement('a');a.href=url;a.download='LEGACY3-settings.json';a.click();}
 finally{URL.revokeObjectURL(url);}
}
export function SettingsShell({storage=defaultStorage()}:{readonly storage:StorageLike|undefined}) {
 const [preferences,setPreferences]=useState<SettingsPreferences>(()=>read(storage));
 const [notice,setNotice]=useState('Settings ready');
 useEffect(()=>{
  document.documentElement.dataset.legacyMotion=preferences.motion;
  document.documentElement.style.setProperty('--legacy-user-text-scale',String(textScale(preferences.textSize)));
  document.documentElement.dataset.legacyAudio=preferences.audio;
 },[preferences]);
 function change<K extends keyof SettingsPreferences>(key:K,value:SettingsPreferences[K]):void {
  const next={...preferences,[key]:value};
  setPreferences(next);
  setNotice(persist(storage,next)?'Preference saved':'Preference applied for this session; storage unavailable');
 }
 function choices<K extends keyof SettingsPreferences>(key:K,title:string,values:readonly {value:SettingsPreferences[K];label:string}[]) {
  return h('fieldset',{class:'legacy-settings-group','data-settings-group':key},[
   h('legend',{},title),
   h('div',{class:'legacy-settings-options'},values.map(({value,label})=>h('button',{
    type:'button','data-setting':key,'data-value':value,'aria-pressed':preferences[key]===value,
    onClick:()=>change(key,value)
   },label)))
  ]);
 }
 return h('section',{class:'legacy-settings legacy-kit-card','aria-label':'Game settings'},[
  h('h2',{},'Settings'),
  h('p',{},'Adjust this device’s interface. No career progress or fighter artwork is changed.'),
  choices('audio','Audio',[{value:'on',label:'On'},{value:'off',label:'Off'}]),
  choices('motion','Motion',[{value:'full',label:'Full'},{value:'reduced',label:'Reduced'}]),
  choices('textSize','Text size',[{value:'normal',label:'Normal'},{value:'large',label:'Large'},{value:'largest',label:'Largest'}]),
  h('section',{class:'legacy-settings-export','aria-label':'Data export'},[
   h('h3',{},'Export preferences'),
   h('p',{},'Download your interface settings as JSON. This does not export or modify saved careers.'),
   h('button',{type:'button','data-export-settings':'true',onClick:()=>{exportSettings(preferences);setNotice('Settings export prepared');}},'Export settings JSON')
  ]),
  h('p',{role:'status','aria-live':'polite','data-settings-status':'true'},notice)
 ]);
}
