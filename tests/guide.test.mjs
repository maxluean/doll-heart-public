import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync,statSync} from 'node:fs';

const html=readFileSync(new URL('../dist/guide.html',import.meta.url),'utf8');
const script=readFileSync(new URL('../dist/guide.js',import.meta.url),'utf8');
function guide(hash=''){
 const events={},keys={},scrolls=[];
 const node=()=>({hidden:false,disabled:false,open:false,textContent:'',style:{},attrs:{},handlers:{},addEventListener(type,fn){this.handlers[type]=fn;},setAttribute(key,value){this.attrs[key]=value;},removeAttribute(key){delete this.attrs[key];},getAttribute(key){return this.attrs[key];},focus(){this.focused=true;}});
 const pages=Array.from({length:6},()=>{const p=node(),h=node();p.querySelector=()=>h;p.heading=h;return p;});
 const links=Array.from({length:6},(_,i)=>({...node(),textContent:`0${i+1} หัวข้อ ${i+1}`}));
 const ids=new Map(['guide-prev','guide-next','guide-image-dialog','guide-page-count','guide-page-status','guide-progress-fill','guide-expanded-image','guide-image-title','guide-image-close'].map(id=>['#'+id,node()]));
 const modal=ids.get('#guide-image-dialog');modal.showModal=()=>{modal.open=true;};modal.close=()=>{modal.open=false;modal.handlers.close?.();};
 const source={...node(),alt:'ภาพเครื่องมือจริง',attrs:{src:'guide-images/02-painter.jpg'}},imageButton={...node(),querySelector:()=>source};
 const location={_hash:hash,get hash(){return this._hash;},set hash(value){this._hash=value.startsWith('#')?value:'#'+value;events.hashchange?.();}};
 const window={addEventListener:(type,fn)=>{events[type]=fn;},scrollTo:value=>scrolls.push(value),PixelLove:{draw(){},gift(){}}};
 const document={title:'',documentElement:{classList:{add(){}}},querySelector:selector=>ids.get(selector),querySelectorAll:selector=>selector==='[data-guide-page]'?pages:selector==='.guide-toc a'?links:selector==='[data-guide-image]'?[imageButton]:[],addEventListener:(type,fn)=>{keys[type]=fn;}};
 vm.runInNewContext(script,{window,document,location});
 return {pages,links,ids,location,scrolls,modal,imageButton,source,click:id=>ids.get('#'+id).handlers.click(),key:(key,extra={})=>keys.keydown({key,target:{closest:()=>null},preventDefault(){},...extra})};
}
test('public guide has exactly six real pages, readable image assets and visible Home entry points',()=>{
 assert.equal((html.match(/data-guide-page\s/g)||[]).length,6);
 for(let i=1;i<=6;i++){assert.ok(html.includes(`id="page-${i}"`));assert.ok(html.includes(`href="#page-${i}"`));}
 const images=[...html.matchAll(/<img[^>]+src="([^"]+)"[^>]+alt="([^"]+)"/g)];assert.ok(images.length>=10);
 for(const [,src,alt] of images){assert.ok(alt.length>10);assert.ok(statSync(new URL('../dist/'+src,import.meta.url)).size>2000,src);}
 for(const src of ['01-animal.jpg','02-outfit.jpg','03-flowers.jpg','04-letter.jpg','05-scene.jpg','06-privacy.jpg'])assert.ok(statSync(new URL('../dist/guide-images/'+src,import.meta.url)).size>6000,src);
 assert.doesNotMatch(html,/<script[^>]+src="[^\"]*(?:cloud|app|route)\.js/);assert.doesNotMatch(script,/\bfetch\s*\(|LoveCloud|localStorage|\/api\//);
 const home=readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');assert.ok((home.match(/href="\/guide"/g)||[]).length>=2);assert.match(home,/คู่มือการใช้งาน/);
});
test('guide pagination, deep links and history expose one page with a correct active state',()=>{
 const g=guide();assert.equal(g.pages.filter(p=>!p.hidden).length,1);assert.equal(g.ids.get('#guide-prev').disabled,true);
 for(let n=1;n<6;n++){g.click('guide-next');assert.equal(g.location.hash,`#page-${n+1}`);assert.equal(g.pages[n].hidden,false);assert.equal(g.links[n].attrs['aria-current'],'step');assert.equal(g.pages.filter(p=>!p.hidden).length,1);}
 assert.equal(g.ids.get('#guide-next').disabled,true);g.click('guide-next');assert.equal(g.location.hash,'#page-6');
 g.location.hash='#page-3';assert.equal(g.pages[2].hidden,false);assert.equal(g.pages[2].heading.focused,true);
 const deep=guide('#page-5');assert.equal(deep.pages[4].hidden,false);assert.equal(deep.ids.get('#guide-page-count').textContent,'5 / 6');
 const invalid=guide('#page-999');assert.equal(invalid.pages[0].hidden,false);
});
test('keyboard navigation pauses for images or editable fields and image zoom restores focus',()=>{
 const g=guide();g.key('ArrowRight');assert.equal(g.location.hash,'#page-2');
 g.key('ArrowRight',{target:{closest:()=>({})}});assert.equal(g.location.hash,'#page-2');
 g.imageButton.handlers.click();assert.equal(g.modal.open,true);assert.equal(g.ids.get('#guide-expanded-image').src,g.source.attrs.src);
 g.key('ArrowRight');assert.equal(g.location.hash,'#page-2');g.click('guide-image-close');assert.equal(g.modal.open,false);assert.equal(g.imageButton.focused,true);
 g.key('ArrowLeft');assert.equal(g.location.hash,'#page-1');g.key('ArrowLeft');assert.equal(g.location.hash,'#page-1');
});
