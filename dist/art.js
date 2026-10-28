/* Original modular pixel artwork. No third-party character assets. */
(() => {
  'use strict';
  const animals=[{id:'rabbit',name:'กระต่าย',nickname:'โมจิ',note:'นุ่มนิ่ม ขี้อ้อน',color:'#f1dfce'},{id:'cat',name:'แมว',nickname:'มิลค์',note:'ซึนหน่อย รักมาก',color:'#e7bda0'},{id:'dog',name:'หมา',nickname:'โทฟุ',note:'อยู่ข้าง ๆ เสมอ',color:'#cfa77e'},{id:'pig',name:'หมู',nickname:'พีช',note:'แก้มกลม ใจฟู',color:'#efbdc2'},{id:'squirrel',name:'กระรอกเผือก',nickname:'สโนว์',note:'ตัวจิ๋ว ใจดวงโต',color:'#f6eee6'}];
  const flowers=[{id:'tulip',name:'ทิวลิป',meaning:'ความรักที่อ่อนโยนและจริงใจ',color:'#d990a6'},{id:'rose',name:'กุหลาบ',meaning:'ความรักและความโรแมนติก',color:'#d1788d'},{id:'daisy',name:'เดซี่',meaning:'ความสดใสและการเริ่มต้นที่ดี',color:'#fff3d1'},{id:'sunflower',name:'ทานตะวัน',meaning:'ความอบอุ่นและความมั่นคง',color:'#e7ba5c'},{id:'hydrangea',name:'ไฮเดรนเยีย',meaning:'ความขอบคุณจากหัวใจ',color:'#acacd8'},{id:'lily',name:'ลิลลี่',meaning:'ความปรารถนาดีที่บริสุทธิ์',color:'#f4e1e7'},{id:'forget',name:'ฟอร์เก็ตมีน็อต',meaning:'ความผูกพันและการระลึกถึง',color:'#94b9d1'}];
  const outfits=[{id:'cardigan',name:'คาร์ดิแกนวันเดต',note:'อุ่นใจเมื่ออยู่ใกล้กัน'},{id:'dress',name:'เดรสผูกโบ',note:'แต่งสวยให้วันพิเศษ'},{id:'overalls',name:'เอี๊ยมไปปิกนิก',note:'เดตเล็ก ๆ ในสวน'},{id:'sailor',name:'เสื้อคอปก',note:'เรียบง่ายแต่น่ารัก'},{id:'none',name:'เจ้าตัวเล็กตัวเปล่า',note:'น่ารักในแบบของตัวเอง'}];
  const hats=[{id:'none',name:'ไม่ใส่หมวก'},{id:'beret',name:'หมวกเบเรต์'},{id:'bow',name:'โบผูกผม'},{id:'bucket',name:'หมวกบักเก็ต'}];
  const glasses=[{id:'none',name:'ไม่ใส่แว่น'},{id:'round',name:'แว่นกลม'},{id:'square',name:'แว่นกรอบเหลี่ยม'},{id:'heart',name:'แว่นหัวใจ'}];
  const backgrounds=[{id:'paper',name:'กระดาษความรัก'},{id:'garden',name:'สวนเล็ก ๆ'},{id:'window',name:'ริมหน้าต่าง'}];
  const shade=(hex,n)=>{const h=hex.replace('#','');const rgb=[0,2,4].map(i=>Math.max(0,Math.min(255,parseInt(h.slice(i,i+2),16)+n)));return '#'+rgb.map(v=>v.toString(16).padStart(2,'0')).join('');};
  const r=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(x,y,w,h);};
  function block(c,x,y,w,h,color,border='#80695d',s=3){
    const polygon=(a,b,d,e,k)=>{c.beginPath();c.moveTo(a+k,b);c.lineTo(a+d-k,b);c.lineTo(a+d-k,b+k);c.lineTo(a+d,b+k);c.lineTo(a+d,b+e-k);c.lineTo(a+d-k,b+e-k);c.lineTo(a+d-k,b+e);c.lineTo(a+k,b+e);c.lineTo(a+k,b+e-k);c.lineTo(a,b+e-k);c.lineTo(a,b+k);c.lineTo(a+k,b+k);c.closePath();c.fill();};
    c.fillStyle=border;polygon(x,y,w,h,s);if(w>4&&h>4){c.fillStyle=color;polygon(x+2,y+2,w-4,h-4,Math.max(1,s-1));}
  }
  function heart(c,x,y,color='#c78396',size=2){const cells=['0110110','1111111','1111111','0111110','0011100','0001000'];cells.forEach((row,j)=>[...row].forEach((v,i)=>{if(v==='1')r(c,x+i*size,y+j*size,size,size,color);}));}
  function bloom(c,id,x,y,color,scale=1){
    c.save();c.translate(x,y);c.scale(scale,scale);const d=shade(color,-22),l=shade(color,19),o=shade(color,-49);
    const radialAt=(cx,cy,n,radius,w,h,fill,phase=0)=>{for(let i=0;i<n;i++){const a=i*Math.PI*2/n+phase;block(c,Math.round(cx+Math.cos(a)*radius-w/2),Math.round(cy+Math.sin(a)*radius-h/2),w,h,fill,shade(fill,-16),Math.min(2,Math.floor(Math.min(w,h)/3)));}};
    const radial=(n,radius,w,h,fill,phase=0)=>radialAt(0,0,n,radius,w,h,fill,phase);
    if(id==='tulip'){r(c,-7,-9,3,5,d);r(c,4,-9,3,5,d);r(c,-5,-7,10,11,color);r(c,-8,-5,16,8,color);r(c,-5,3,10,3,d);r(c,-1,-7,3,10,l);}
    else if(id==='rose'){block(c,-9,-8,18,17,color,o,4);r(c,-5,-5,10,3,l);r(c,-5,-2,3,7,d);r(c,-2,2,8,3,d);r(c,3,-2,3,6,o);r(c,-1,-2,4,3,l);}
    else if(id==='peony'){[[-7,-4],[0,-9],[7,-4],[-7,4],[0,7],[7,4]].forEach(([a,b],i)=>block(c,a-5,b-4,10,9,i%2?l:color,d,3));block(c,-5,-4,10,10,color,o,3);r(c,-2,-1,5,3,l);r(c,1,2,3,3,d);}
    else if(id==='lavender'){r(c,-1,-7,2,21,'#85956c');[[-4,-11],[1,-8],[-5,-4],[1,0],[-4,4]].forEach(([a,b],i)=>{r(c,a,b,5,4,i%2?l:color);r(c,a,b,2,2,d);});r(c,-7,11,7,2,'#a1ad87');}
    else if(id==='daisy'||id==='sunflower'){[[0,-10],[-8,-7],[-11,0],[-8,7],[0,10],[8,7],[11,0],[8,-7]].forEach(([a,b])=>{r(c,a-3,b-3,6,6,d);r(c,a-2,b-3,5,5,color);});block(c,-5,-5,11,11,id==='sunflower'?'#987045':'#e8bc61',id==='sunflower'?'#7a5c3c':'#c99b48',3);r(c,-2,-2,3,3,'#f4d58b');}
    else if(id==='hydrangea'){[[-6,-5],[3,-6],[-8,3],[1,2],[7,2],[0,9]].forEach(([a,b],i)=>{r(c,a-3,b-3,7,7,i%2?l:color);r(c,a-1,b-1,2,2,'#f9f0df');});}
    else if(id==='lily'){[[-4,-12],[4,-9],[-10,-3],[9,2],[-5,7],[2,5]].forEach(([a,b])=>{r(c,a-2,b-2,5,8,color);r(c,a,b,2,4,d);});r(c,-2,-2,4,5,'#d1af6f');}
    else if(id==='carnation'){radial(12,9,5,6,color);radial(9,6,5,5,l,.3);radial(6,3,3,4,color);r(c,-2,-2,4,4,d);}
    else if(id==='gerbera'){radial(16,11,3,7,color);radial(12,7,3,5,l,.2);block(c,-5,-5,10,10,'#997153',d,3);r(c,-2,-2,4,4,'#ead296');}
    else if(id==='orchid'){[[-9,-8,8,9],[-2,-13,8,10],[5,-7,10,8],[-10,2,10,8],[3,2,10,8]].forEach(([a,b,w,h])=>block(c,a,b,w,h,color,d,3));block(c,-4,-2,9,9,l,d,2);block(c,-4,6,9,8,d,o,3);r(c,-1,-1,3,5,'#f4d399');}
    else if(id==='lotus'){[[-13,0,9,10],[-9,-7,9,15],[6,-4,9,14],[-3,-14,8,21],[-7,4,15,8]].forEach(([a,b,w,h],i)=>block(c,a,b,w,h,i===3?l:color,d,3));r(c,-3,6,7,3,'#e2c27a');r(c,-9,11,18,2,d);}
    else if(id==='sakura'){radial(5,9,9,9,color,-Math.PI/2);[[-2,-14],[11,-5],[7,10],[-9,10],[-14,-5]].forEach(([a,b])=>r(c,a,b,3,3,l));radial(5,3,2,4,d);r(c,-2,-2,4,4,'#e4c27c');}
    else if(id==='chrysanthemum'){radial(18,11,3,5,color,.1);radial(13,8,3,6,l,.2);radial(10,4,3,5,color);block(c,-3,-3,6,6,d,o,2);}
    else if(id==='cosmos'){radial(8,10,7,7,color,Math.PI/8);radial(8,6,4,5,l,Math.PI/8);block(c,-4,-4,8,8,'#e5c174','#c4a05b',2);r(c,-1,-2,3,3,'#f7dea0');}
    else if(id==='poppy'){[[-12,-10],[1,-11],[-12,1],[1,1]].forEach(([a,b],i)=>block(c,a,b,12,12,i%2?l:color,d,3));radial(8,4,3,3,'#68535b');block(c,-4,-4,8,8,'#4e424e','#5e5058',2);r(c,-1,-2,2,2,'#bcaaa1');}
    else if(id==='iris'){[[-4,-14,8,15],[-12,-8,8,13],[5,-8,8,13]].forEach(([a,b,w,h])=>block(c,a,b,w,h,color,d,3));[[-12,3,9,10],[4,3,9,10],[-4,2,8,13]].forEach(([a,b,w,h])=>block(c,a,b,w,h,l,d,3));r(c,-2,-2,4,10,'#e6ca76');r(c,-8,4,4,3,'#ebd796');r(c,6,4,4,3,'#ebd796');}
    else if(id==='magnolia'){radial(6,8,8,12,color,-Math.PI/2);radial(3,5,6,10,l,-Math.PI/2);block(c,-3,-5,6,10,'#c4ac79','#bba16d',2);r(c,-1,-4,2,6,'#e6d2a0');}
    else if(id==='gardenia'){radial(8,9,8,8,color,.2);radial(6,5,7,8,l,.5);[[-4,-6,7,3],[2,-2,3,7],[-5,3,7,3],[-6,-4,3,7]].forEach(([a,b,w,h])=>r(c,a,b,w,h,d));r(c,-2,-2,4,4,color);}
    else if(id==='jasmine'){radial(7,8,5,10,color,-Math.PI/2);radial(7,5,4,8,l,-Math.PI/2);r(c,-2,-2,4,4,'#d3bc77');r(c,-1,-1,2,2,'#f7dfa4');}
    else if(id==='camellia'){radial(7,9,9,9,color);radial(7,5,7,7,l,.4);radial(7,3,2,3,'#e6c580');r(c,-2,-2,4,4,'#f6dfb1');}
    else if(id==='orange-blossom'){r(c,-12,7,9,4,'#a6b68a');r(c,5,9,8,4,'#a6b68a');radial(5,8,6,10,color,-Math.PI/2);radial(7,4,2,2,'#d5b36a');r(c,-2,-2,4,4,'#f0d48d');}
    else if(id==='bluebell'){r(c,0,-13,2,27,'#8c9f78');[[-5,-10],[5,-3],[-5,5]].forEach(([a,b],i)=>{r(c,Math.min(0,a),b-4,Math.abs(a)+2,2,'#9dad83');block(c,a-4,b-3,8,8,i===1?l:color,d,2);r(c,a-5,b+4,10,2,d);r(c,a-2,b-2,2,4,l);});}
    else if(id==='delphinium'){r(c,-1,-14,2,28,'#8e9f78');[[-1,-11],[-5,-5],[4,-4],[-5,3],[4,4],[-1,10]].forEach(([a,b],i)=>{block(c,a-4,b-4,8,8,i%2?l:color,d,2);r(c,a-1,b-1,2,2,'#f5e7d4');});}
    else if(id==='statice'){r(c,-1,-6,2,20,'#8e9f78');r(c,-9,0,9,2,'#8e9f78');r(c,1,-2,9,2,'#8e9f78');[[-10,-5],[0,-10],[10,-7],[-5,2],[6,2]].forEach(([a,b],i)=>{radialAt(a,b,4,3,4,4,i%2?l:color);r(c,a-1,b-1,2,2,'#efe1c6');});}
    else if(id==='lilac'){r(c,-1,1,2,14,'#91a078');[[0,-12],[-4,-6],[4,-6],[-8,0],[0,1],[8,0],[-5,7],[5,7]].forEach(([a,b],i)=>{block(c,a-3,b-3,7,7,i%2?l:color,d,2);r(c,a,b,2,2,'#f4e5ec');});}
    else if(id==='daffodil'){radial(6,9,8,10,color,-Math.PI/2);block(c,-5,-5,10,12,'#e9b064','#cb9454',3);r(c,-4,-4,8,4,'#f6cf85');r(c,-3,1,6,5,'#b8854e');r(c,-2,2,4,2,'#edbd72');}
    else if(id==='anemone'){radial(7,9,10,10,color,.2);radial(12,5,2,3,'#655361');block(c,-5,-5,10,10,'#574754','#483b46',3);r(c,-2,-2,2,2,'#b4a0ad');r(c,2,0,2,2,'#a692a1');}
    else{[[-6,-5],[2,-7],[7,0],[2,6],[-5,5]].forEach(([a,b])=>r(c,a-3,b-3,7,7,color));r(c,-2,-2,5,5,'#efe0a0');}
    c.restore();
  }
  function bouquet(c,s){
    const selected=s.flowers?.length?s.flowers:[{id:'tulip',color:'#d990a6'}];
    const points=[[-14,-13],[7,-18],[-1,-4],[-25,-2],[21,-1]];
    c.save();c.translate(116,126);
    // Each stem converges inside the wrapper; no parallel stalks escape the paper.
    points.forEach(([x,y])=>{c.fillStyle='#85956c';c.beginPath();c.moveTo(x,y+6);c.lineTo(x+2,y+6);c.lineTo(3,37);c.lineTo(0,37);c.closePath();c.fill();r(c,x-3,y+11,5,3,'#9ba77f');});
    const wrap=s.wrapColor||'#ead4bd',border=shade(wrap,-31);c.fillStyle=border;c.beginPath();c.moveTo(-31,8);c.lineTo(28,8);c.lineTo(8,50);c.lineTo(-9,50);c.closePath();c.fill();c.fillStyle=wrap;c.beginPath();c.moveTo(-28,10);c.lineTo(25,10);c.lineTo(6,48);c.lineTo(-7,48);c.closePath();c.fill();
    r(c,-13,23,25,3,shade(wrap,16));r(c,-9,28,18,2,shade(wrap,-12));
    points.forEach(([x,y],i)=>{const f=selected[i%selected.length];bloom(c,f.id,x,y,f.color,1);});
    const ribbon=s.ribbonColor||'#b96e83';r(c,-13,37,24,4,ribbon);r(c,-18,35,9,7,ribbon);r(c,7,35,9,7,ribbon);r(c,-9,39,5,14,ribbon);r(c,3,39,5,12,ribbon);r(c,-4,36,6,7,shade(ribbon,18));
    c.restore();
  }
  function animal(c,s,{base=false,bouquetVisible=true,pose=null}={}){
    const kind=s.animal||'rabbit',body=s.bodyColor||'#f1dfce',out='#80695d',shadow=shade(body,-16),light=shade(body,9),limb=kind==='panda'?'#695b56':kind==='red-panda'?'#6f4b43':body,limbShadow=shade(limb,-16);c.save();c.translate(30,12);
    // Tail and ears live behind the body, clothes and face.
    if(kind==='red-panda'){block(c,105,111,31,49,body,out,6);block(c,114,94,24,30,body,out,5);r(c,111,130,23,7,light);r(c,111,146,18,6,light);r(c,117,110,19,6,light);r(c,121,97,12,5,light);}
    if(kind==='monkey'){block(c,106,123,28,34,body,out,6);block(c,112,128,14,21,'#fcf6f0',out,4);r(c,108,143,12,9,body);r(c,109,144,7,4,light);}
    if(kind==='squirrel'){block(c,97,104,30,49,body,out,6);block(c,107,88,22,35,body,out,5);r(c,104,117,7,22,shadow);r(c,112,100,4,17,light);}
    else if(kind==='cat'){block(c,101,132,16,26,body,out,4);r(c,106,134,5,17,shadow);}
    else if(kind==='dog'){block(c,101,133,16,15,body,out,3);}
    else if(kind==='rabbit'){block(c,101,136,15,15,light,out,4);}
    else if(kind==='pig'){r(c,106,136,9,3,out);r(c,112,130,3,9,out);r(c,108,128,6,3,out);}
    if(kind==='panda'){block(c,30,27,24,24,limb,out,6);block(c,84,27,24,24,limb,out,6);r(c,36,33,11,11,'#8a7770');r(c,90,33,11,11,'#8a7770');}
    if(kind==='red-panda'){block(c,31,25,24,31,body,out,5);block(c,83,25,24,31,body,out,5);r(c,36,30,14,18,'#f5e3cc');r(c,88,30,14,18,'#f5e3cc');r(c,40,34,6,11,shadow);r(c,92,34,6,11,shadow);}
    if(kind==='monkey'){block(c,16,51,29,32,body,out,8);block(c,93,51,29,32,body,out,8);block(c,23,58,16,19,'#ead3b4',shadow,5);block(c,100,58,16,19,'#ead3b4',shadow,5);}
    if(kind==='rabbit'){block(c,39,5,19,49,body,out,4);block(c,77,5,19,49,body,out,4);r(c,45,14,7,31,'#dfafb2');r(c,83,14,7,31,'#dfafb2');r(c,45,14,3,31,'#edc8c6');}
    if(kind==='cat'){c.fillStyle=out;c.beginPath();c.moveTo(33,56);c.lineTo(33,22);c.lineTo(58,43);c.lineTo(80,43);c.lineTo(103,22);c.lineTo(103,57);c.fill();c.fillStyle=body;c.beginPath();c.moveTo(36,54);c.lineTo(36,28);c.lineTo(60,47);c.lineTo(80,47);c.lineTo(100,28);c.lineTo(100,56);c.fill();r(c,39,35,7,13,'#d49d9f');r(c,90,35,7,13,'#d49d9f');}
    if(kind==='pig'){block(c,30,28,23,28,body,out,4);block(c,82,28,23,28,body,out,4);r(c,36,34,10,13,'#d991a2');r(c,89,34,10,13,'#d991a2');}
    if(kind==='squirrel'){block(c,35,24,20,28,body,out,4);block(c,80,24,20,28,body,out,4);r(c,41,30,8,13,'#eac9c8');r(c,86,30,8,13,'#eac9c8');r(c,38,20,6,9,body);r(c,90,20,6,9,body);}
    // Feet, body and arms.
    block(c,40,150,23,22,limb,out,4);block(c,74,150,23,22,limb,out,4);r(c,44,165,15,3,limbShadow);r(c,78,165,15,3,limbShadow);
    block(c,40,101,58,57,body,out,6);r(c,45,142,48,12,shadow);if(!pose?.wave){block(c,29,109,17,37,limb,out,4);r(c,34,134,8,8,limbShadow);}block(c,94,109,17,37,limb,out,4);
    const cloth=s.outfitColor||'#c48e9b',dark=shade(cloth,-23),pale=shade(cloth,17),style=base?'none':s.outfit;
    if(style!=='none'&&style!=='custom'){
      block(c,40,104,58,47,cloth,out,4);r(c,43,106,9,34,cloth);r(c,87,106,8,34,cloth);
      if(style==='cardigan'){r(c,64,106,7,43,dark);r(c,62,106,3,19,'#f4e5d3');r(c,69,106,3,19,'#f4e5d3');r(c,42,139,54,5,pale);[125,135,144].forEach(y=>r(c,67,y,2,2,'#f7e9d2'));r(c,47,130,9,3,dark);r(c,80,130,9,3,dark);r(c,42,149,24,8,'#a48c76');r(c,72,149,24,8,'#a48c76');}
      if(style==='dress'){r(c,36,132,65,21,cloth);r(c,32,145,73,13,cloth);r(c,36,155,65,3,dark);r(c,42,124,52,4,'#f7e4d3');r(c,60,122,7,8,dark);r(c,70,122,7,8,dark);r(c,67,124,4,5,pale);r(c,45,138,3,13,pale);r(c,83,138,3,13,pale);}
      if(style==='overalls'){r(c,43,106,51,17,'#f5e9d8');r(c,49,108,5,30,dark);r(c,82,108,5,30,dark);r(c,46,123,45,28,cloth);r(c,59,129,20,12,pale);r(c,44,148,23,10,cloth);r(c,71,148,23,10,cloth);r(c,50,121,3,3,'#e9ca83');r(c,83,121,3,3,'#e9ca83');}
      if(style==='sailor'){r(c,43,108,50,7,'#f5e9da');r(c,46,115,12,5,'#f5e9da');r(c,80,115,11,5,'#f5e9da');r(c,57,120,8,4,'#f5e9da');r(c,72,120,8,4,'#f5e9da');r(c,66,119,5,20,dark);r(c,42,145,54,11,'#a48c76');}
      if(style==='cardigan'||style==='sailor'){if(!pose?.wave){block(c,29,110,16,26,cloth,out,3);r(c,31,130,12,4,pale);}block(c,95,110,16,26,cloth,out,3);r(c,97,130,12,4,pale);}
    }
    const sleeve=(x,y)=>x>=28&&x<40&&y>=109&&y<147;
    if(!base&&style==='custom')window.CustomWear?.draw(c,'outfit',s.customDesigns?.outfit,pose?.wave?(x,y)=>!sleeve(x,y):null);
    if(pose?.wave){c.save();c.translate(37,115);c.rotate(pose.waveAngle??2.5);block(c,-8,0,17,37,limb,out,4);r(c,-3,28,7,6,limbShadow);if(style==='cardigan'||style==='sailor'){block(c,-8,0,17,24,cloth,out,3);r(c,-6,19,13,3,pale);}if(!base&&style==='custom'){c.save();c.translate(-37,-115);window.CustomWear?.draw(c,'outfit',s.customDesigns?.outfit,sleeve);c.restore();}c.restore();}
    // Wide soft face, small eyes and blush, all aligned to the pixel grid.
    block(c,29,43,79,62,body,out,8);r(c,35,51,7,34,light);r(c,40,97,57,5,shadow);r(c,39,64,5,5,light);
    if(kind==='dog'){block(c,19,43,20,47,shade(body,-32),out,4);block(c,99,43,20,47,shade(body,-32),out,4);r(c,22,50,4,28,shade(body,-17));block(c,46,74,45,25,light,shadow,5);}
    if(kind==='cat'){r(c,62,45,5,13,shadow);r(c,71,45,5,10,shadow);r(c,31,84,11,2,out);r(c,94,84,12,2,out);r(c,31,91,10,2,out);r(c,95,91,11,2,out);}
    if(kind==='panda'){block(c,43,65,18,19,'#79665e','#6b5a54',5);block(c,77,65,18,19,'#79665e','#6b5a54',5);block(c,56,82,25,15,light,shadow,4);}
    if(kind==='red-panda'){block(c,33,69,22,22,'#f5e4ce','#e7cfb8',5);block(c,82,69,22,22,'#f5e4ce','#e7cfb8',5);block(c,56,79,26,21,'#f5e4ce','#e7cfb8',5);r(c,47,62,9,9,shadow);r(c,82,62,9,9,shadow);}
    if(kind==='monkey'){block(c,38,58,30,31,'#eddbbd','#d2b594',7);block(c,69,58,30,31,'#eddbbd','#d2b594',7);block(c,45,78,48,22,'#eddbbd','#d2b594',6);r(c,49,82,37,13,'#f3e4cc');}
    const eye=kind==='squirrel'?'#aa6672':'#55473e',eyeHeight=pose?.blink?2:7,eyeY=pose?.blink?76:73;r(c,49,eyeY,5,eyeHeight,eye);r(c,83,eyeY,5,eyeHeight,eye);if(!pose?.blink){r(c,50,73,2,2,'#fff8eb');r(c,84,73,2,2,'#fff8eb');}r(c,39,84,12,5,'#dfaaa8');r(c,88,84,12,5,'#dfaaa8');
    if(kind==='pig'){block(c,57,81,24,14,'#dd9ca9','#bd7d88',3);r(c,62,86,3,4,'#a86f7c');r(c,73,86,3,4,'#a86f7c');r(c,64,97,10,2,out);}
    else{r(c,65,84,7,3,kind==='cat'?'#bd8288':kind==='panda'?'#584b47':kind==='red-panda'?'#69504b':'#9a7b70');r(c,68,87,2,5,out);r(c,62,91,6,2,out);r(c,70,91,6,2,out);}
    if(!base&&s.glasses!=='none'){
      if(s.glasses==='round'){block(c,41,66,23,23,body,'#766259',6);block(c,75,66,23,23,body,'#766259',6);r(c,49,eyeY,5,eyeHeight,eye);r(c,83,eyeY,5,eyeHeight,eye);r(c,64,73,11,2,'#766259');}
      else if(s.glasses==='square'){block(c,40,67,25,20,body,'#766259',2);block(c,75,67,25,20,body,'#766259',2);r(c,49,eyeY,5,eyeHeight,eye);r(c,83,eyeY,5,eyeHeight,eye);r(c,65,73,10,2,'#766259');}
      else if(s.glasses==='heart'){heart(c,40,69,'#bb758b',3);heart(c,76,69,'#bb758b',3);r(c,61,75,16,2,'#bb758b');r(c,48,74,5,3,'#f1b8c8');r(c,84,74,5,3,'#f1b8c8');}
    }
    if(!base&&s.glasses==='custom')window.CustomWear?.draw(c,'glasses',s.customDesigns?.glasses);
    if(!base&&s.hat!=='none'){
      const h=shade(cloth,-12);if(s.hat==='bow'){r(c,81,38,13,14,h);r(c,99,38,13,14,h);r(c,94,41,6,9,pale);r(c,82,37,8,3,dark);r(c,104,37,8,3,dark);}
      else if(s.hat==='beret'){block(c,33,34,72,17,h,out,5);r(c,41,28,54,9,h);r(c,68,23,7,7,out);r(c,38,48,62,3,dark);}
      else if(s.hat==='bucket'){block(c,43,25,50,25,h,out,4);block(c,30,45,77,9,h,out,2);r(c,45,41,46,3,pale);}
    }
    if(!base&&s.hat==='custom')window.CustomWear?.draw(c,'hat',s.customDesigns?.hat);
    if(!base&&bouquetVisible&&s.flowers?.length){bouquet(c,s);block(c,96,140,13,12,body,out,3);}
    c.restore();
  }
  function draw(canvas,s,opts={}){const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;c.clearRect(0,0,canvas.width,canvas.height);c.save();c.scale(canvas.width/200,canvas.height/216);r(c,52,188,100,6,'#cbb4a335');r(c,64,194,76,3,'#cbb4a322');if(opts.pose){c.translate(100,185);c.rotate(opts.pose.tilt||0);c.translate(-100,-185+(opts.pose.bob||0));}animal(c,s,opts);c.restore();}
  function flowerIcon(canvas,f){const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;c.clearRect(0,0,canvas.width,canvas.height);c.save();c.translate(canvas.width/2,canvas.height/2);bloom(c,f.id,0,0,f.color);c.restore();}
  function gift(canvas,type='envelope'){
    const c=canvas.getContext('2d');c.clearRect(0,0,200,180);c.imageSmoothingEnabled=false;r(c,47,151,108,5,'#dcc8b944');heart(c,36,40,'#d6a0a9',1);heart(c,158,72,'#d6a0a9',1);r(c,150,31,3,13,'#d4b790');r(c,145,36,13,3,'#d4b790');
    if(type==='envelope'){block(c,35,58,130,80,'#f7e9d4','#b59580',5);c.fillStyle='#e9d0bd';c.beginPath();c.moveTo(38,61);c.lineTo(100,103);c.lineTo(162,61);c.lineTo(162,135);c.lineTo(38,135);c.fill();c.fillStyle='#faeeda';c.beginPath();c.moveTo(38,61);c.lineTo(100,102);c.lineTo(162,61);c.fill();r(c,95,100,14,16,'#bd7789');heart(c,96,102,'#f9dedc',2);r(c,44,127,35,2,'#d2b39b');}
    else{block(c,48,68,107,73,'#eac0c3','#ac7f7f',4);block(c,43,60,117,18,'#f0cbd0','#ac7f7f',4);r(c,92,63,18,75,'#b97b8e');r(c,95,63,4,75,'#cc94a2');block(c,68,41,27,24,'#c58a9b','#a16b7c',4);block(c,108,41,27,24,'#c58a9b','#a16b7c',4);r(c,83,44,9,7,'#e0acb9');r(c,111,44,9,7,'#e0acb9');block(c,93,52,16,17,'#d39cab','#a16b7c',3);heart(c,120,102,'#f8e4d5',2);}
  }
  function scene(c,id,w,h){
    if(id==='starry'){r(c,0,0,w,h,'#e1d8e9');for(let x=30;x<w;x+=83)for(let y=20;y<h;y+=93){r(c,x,y,2,10,'#fff5d6');r(c,x-4,y+4,10,2,'#fff5d6');}return;}if(id==='cafe'){r(c,0,0,w,h,'#f5e9dc');for(let x=0;x<w;x+=76)r(c,x,0,38,h,'#e8c9b95c');r(c,0,h*.8,w,3,'#d6b8a0');return;}
    r(c,0,0,w,h,id==='garden'?'#eceddf':id==='window'?'#f5e3df':'#f7eee4');
    if(id==='paper'){for(let x=0;x<w;x+=36)r(c,x,0,1,h,'#decbb83b');for(let y=0;y<h;y+=36)r(c,0,y,w,1,'#decbb83b');}
    else if(id==='garden'){for(let x=14;x<w;x+=36)for(let y=14;y<h;y+=36)r(c,x,y,2,2,'#b6c09877');}
    else{for(let x=0;x<w;x+=220)r(c,x,0,7,h,'#fff9eea0');for(let y=0;y<h;y+=260)r(c,0,y,w,7,'#fff9eea0');}
  }
  window.PixelLove={animals,flowers,outfits,hats,glasses,backgrounds,shade,draw,animal,bouquet,bloom,flowerIcon,gift,scene,heart,rect:r};
})();
