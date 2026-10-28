import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../dist/brand.js',import.meta.url),'utf8');
function mascot({paused=false,reduced=false,motion,hidden=false}={}){
 const listeners={},media={matches:reduced,addEventListener:(key,fn)=>{listeners.media=fn;}},root={dataset:{motion}},host={innerHTML:'',querySelector:()=>({getAttribute:()=> 'brand/rabbit-v1.png'})};
 const document={hidden,documentElement:root,querySelectorAll:()=>[host],addEventListener:(key,fn)=>{listeners[key]=fn;}};
 let observer;
 vm.runInNewContext(source,{document,window:{addEventListener:(key,fn)=>{listeners[key]=fn;}},localStorage:{getItem:()=>String(paused)},matchMedia:()=>media,MutationObserver:class{constructor(fn){observer=fn;}observe(){}}});
 return {root,document,host,media,listeners,setPaused:v=>{paused=v;},sync:()=>observer()};
}
test('logo motion respects animation settings, reduced motion and hidden tabs',()=>{
 const m=mascot();assert.equal(m.root.dataset.brandMotion,'on');m.setPaused(true);m.sync();assert.equal(m.root.dataset.brandMotion,'off');m.setPaused(false);m.root.dataset.motion='off';m.sync();assert.equal(m.root.dataset.brandMotion,'off');m.root.dataset.motion='on';m.sync();assert.equal(m.root.dataset.brandMotion,'on');m.document.hidden=true;m.listeners.visibilitychange();assert.equal(m.root.dataset.brandMotion,'off');m.document.hidden=false;m.listeners.visibilitychange();assert.equal(m.root.dataset.brandMotion,'on');m.media.matches=true;m.listeners.media();assert.equal(m.root.dataset.brandMotion,'off');assert.equal(mascot({reduced:true}).root.dataset.brandMotion,'off');
});
test('approved logo is layered for ears and blinking, and all pages declare rabbit favicons',()=>{
 const m=mascot();for(const part of ['brand-sway','brand-ear-left','brand-ear-right','brand-eyes'])assert.ok(m.host.innerHTML.includes(part));assert.ok(m.host.innerHTML.includes('brand/rabbit-v1.png'));
 for(const file of ['index.html','maker.html','guide.html','privacy.html','purchase-policy.html']){const html=readFileSync(new URL('../dist/'+file,import.meta.url),'utf8');assert.match(html,/rel="icon"[^>]+rabbit-favicon-v1.svg/);assert.match(html,/rel="apple-touch-icon"/);if(['index.html','maker.html','guide.html'].includes(file))assert.match(html,/data-brand-logo/);}
 const favicon=readFileSync(new URL('../dist/brand/rabbit-favicon-v1.svg',import.meta.url),'utf8');const encoded=favicon.match(/base64,([^"]+)/)[1];assert.deepEqual(Buffer.from(encoded,'base64'),readFileSync(new URL('../dist/brand/rabbit-v1.png',import.meta.url)));
});
