import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync,existsSync} from 'node:fs';
const source=readFileSync(new URL('../dist/music.js',import.meta.url),'utf8');
const intentKey='doll-heart:music-start',muteKey='doll-heart:music-muted';
const tick=()=>new Promise(resolve=>setImmediate(resolve));
function player({home=false,create=false,recipient=false,intent=false,muted=false,deny=false,deferred=false}={}){
 const events={},windowEvents={},session=new Map(intent?[[intentKey,'1']]:[]),local=new Map(muted?[[muteKey,'1']]:[]);
 const store=map=>({getItem:key=>map.get(key)||null,setItem:(key,value)=>map.set(key,value)});
 const button={attrs:{},dataset:{},handlers:{},disabled:false,setAttribute(k,v){this.attrs[k]=v;},addEventListener(k,fn){this.handlers[k]=fn;}};
 const audio={paused:true,handlers:{},playCalls:0,addEventListener(k,fn){this.handlers[k]=fn;},pause(){this.paused=true;this.handlers.pause?.();},play(){this.playCalls++;if(deny)return Promise.reject(Object.assign(new Error('blocked'),{name:'NotAllowedError'}));if(deferred)return new Promise(resolve=>{this.resolve=()=>{this.paused=false;this.handlers.playing?.();resolve();};});this.paused=false;this.handlers.playing?.();return Promise.resolve();}};
 let created=0,observer;
 const document={hidden:false,documentElement:{dataset:{view:recipient?'recipient':'maker'}},querySelector:()=>home?null:button,body:{append(){}},createElement(tag){assert.equal(tag,'audio');created++;return audio;},addEventListener(k,fn){(events[k]??=[]).push(fn);}};
 const window={LoveRoute:{isRecipient:()=>recipient,isCreate:()=>create},addEventListener(k,fn){windowEvents[k]=fn;}};
 const MutationObserver=class {constructor(fn){observer=fn;}observe(){}};
 vm.runInNewContext(source,{window,document,location:{origin:'https://specialdoll.pages.dev'},URL,sessionStorage:store(session),localStorage:store(local),MutationObserver});
 const fire=(type,target={closest:()=>null},extra={})=>{for(const fn of events[type]||[])fn({target,...extra});};
 return {button,audio,document,session,local,get created(){return created;},click:()=>button.handlers.click(),fire,allow:()=>{deny=false;},view(value){document.documentElement.dataset.view=value;observer?.();},windowEvent:(type,event)=>windowEvents[type]?.(event)};
}
test('welcome page marks a real local start link and never creates or loads audio',()=>{
 const x=player({home:true});
 x.fire('click',{closest:()=>({getAttribute:()=>'/make?create=1'})});
 assert.equal(x.session.get(intentKey),'1');assert.equal(x.created,0);
 const external=player({home:true});external.fire('click',{closest:()=>({getAttribute:()=> 'https://other.test/make?create=1'})});assert.equal(external.session.size,0);
});
test('start entry plays the supplied loop softly; button can stop and resume with remembered mute',async()=>{
 const x=player({create:true});await tick();
 assert.equal(x.audio.src,'/audio/romantic-601649.mp3');assert.equal(x.audio.volume,.22);assert.equal(x.audio.loop,true);assert.equal(x.button.attrs['aria-pressed'],'true');
 x.click();assert.equal(x.audio.paused,true);assert.equal(x.button.attrs['aria-pressed'],'false');assert.equal(x.local.get(muteKey),'1');
 x.click();await tick();assert.equal(x.audio.paused,false);assert.equal(x.button.attrs['aria-pressed'],'true');
 const muted=player({create:true,muted:true});await tick();assert.equal(muted.created,0);muted.click();await tick();assert.equal(muted.audio.paused,false);
});
test('ordinary maker visits and recipient gift links do not start the background music',async()=>{
 for(const x of [player(),player({recipient:true,intent:true,create:true})]){await tick();assert.equal(x.created,0);assert.equal(x.button.attrs['aria-pressed'],'false');}
 assert.equal(player({recipient:true}).button.disabled,true);
});
test('blocked navigation playback retries on interaction and external song stops background resuming',async()=>{
 const x=player({intent:true,deny:true});await tick();assert.equal(x.button.dataset.state,'blocked');assert.equal(x.button.attrs['aria-pressed'],'false');
 x.allow();x.fire('pointerdown');await tick();assert.equal(x.audio.paused,false);
 x.fire('click',{closest:selector=>selector==='.song-card'?{}:null});assert.equal(x.audio.paused,true);
 x.windowEvent('pageshow');await tick();assert.equal(x.audio.paused,true);assert.equal(x.session.get(intentKey),'0');
});
test('previewing recipient or hiding the tab pauses sound; manual mute wins over resume',async()=>{
 const x=player({intent:true});await tick();x.view('recipient');assert.equal(x.audio.paused,true);assert.equal(x.button.disabled,true);
 x.view('maker');await tick();assert.equal(x.audio.paused,false);
 x.document.hidden=true;x.fire('visibilitychange');assert.equal(x.audio.paused,true);
 x.document.hidden=false;x.fire('visibilitychange');await tick();assert.equal(x.audio.paused,false);
 x.click();x.windowEvent('pageshow');await tick();assert.equal(x.audio.paused,true);
});
test('stopping an in-flight play request cannot turn the speaker back on',async()=>{
 const x=player({create:true,deferred:true});assert.equal(x.button.attrs['aria-busy'],'true');x.click();x.audio.resolve();await tick();assert.equal(x.audio.paused,true);assert.equal(x.button.attrs['aria-pressed'],'false');
});
test('public source omits the soundtrack and retains the pixel speaker control',()=>{
 assert.equal(existsSync(new URL('../dist/audio/romantic-601649.mp3',import.meta.url)),false);
 const html=readFileSync(new URL('../dist/maker.html',import.meta.url),'utf8');
 assert.match(html,/data-music-disabled="true"/);assert.doesNotMatch(html,/id="receiver-demo"/);assert.match(html,/<dialog id="settings-dialog"[^]*?id="music-toggle"/);
 assert.match(html,/id="music-toggle"[^>]*aria-pressed="false"/);assert.match(html,/class="music-waves"/);assert.match(html,/src="music.js"/);
});
