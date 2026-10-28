import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {schema,products,requiredProducts} from '../lib/schema.mjs';

const scenes=products.filter(p=>p.collection==='scenes-5');
function drawing(){
 const commands=[],stack=[];
 const c=new Proxy({fillStyle:'',save(){stack.push(true);commands.push(['save']);},restore(){assert.ok(stack.pop());commands.push(['restore']);},fillRect(...args){commands.push(['fill',...args,this.fillStyle]);},createLinearGradient(...args){commands.push(['gradient',...args]);return {addColorStop(...args){commands.push(['stop',...args]);}};}},{get:(target,key)=>key in target?target[key]:(...args)=>commands.push([key,...args])});
 return {c,commands,stack};
}
function artwork(){const window={};for(const file of ['art.js','scenes.js'])vm.runInNewContext(readFileSync(new URL('../dist/'+file,import.meta.url),'utf8'),{window});return window.PixelLove;}
test('five new scenes cost THB40 and remain ownership-gated in normalized gift payloads',()=>{
 assert.equal(scenes.length,5);assert.equal(new Set(scenes.map(p=>p.asset)).size,5);
 for(const p of scenes){assert.equal(p.amountMinor,4000);assert.equal(p.trialAllowed,false);const s=schema.normalize({...schema.defaults(),background:p.asset});assert.equal(s.background,p.asset);assert.deepEqual(requiredProducts(s),[p.id]);}
 assert.equal(products.find(p=>p.id==='bg-starry').amountMinor,2000);assert.equal(products.find(p=>p.id==='bg-cafe').amountMinor,2000);
});
test('new scenery is distinct, deterministic, scales to PNG and restores drawing state',()=>{
 const P=artwork(),signatures=[];
 for(const p of scenes){const a=drawing(),b=drawing();P.scene(a.c,p.asset,640,560);P.scene(b.c,p.asset,640,560);assert.equal(JSON.stringify(a.commands),JSON.stringify(b.commands));assert.ok(a.commands.filter(x=>x[0]==='fill').length>100,p.id);assert.equal(a.stack.length,0);signatures.push(JSON.stringify(a.commands));const exported=drawing();P.scene(exported.c,p.asset,896,716);assert.equal(exported.stack.length,0);assert.ok(exported.commands.some(x=>x[0]==='scale'&&x[1]===896/320&&x[2]===716/280));}
 assert.equal(new Set(signatures).size,5);
});
test('legacy scene renderer remains byte-for-byte equivalent at the canvas-command level',()=>{
 const window={};vm.runInNewContext(readFileSync(new URL('../dist/art.js',import.meta.url),'utf8'),{window});const old=window.PixelLove.scene;
 vm.runInNewContext(readFileSync(new URL('../dist/scenes.js',import.meta.url),'utf8'),{window});
 for(const id of ['paper','garden','window','starry','cafe']){const a=drawing(),b=drawing();old(a.c,id,640,560);window.PixelLove.scene(b.c,id,640,560);assert.deepEqual(a.commands,b.commands);}
});
