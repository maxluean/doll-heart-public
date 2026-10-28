(() => {
  'use strict';
  const W=window.CustomWear,P=window.PixelLove,prefix='doll-heart:paint:v1:';
  const swatches=['#80695d','#fff1df','#c48e9b','#e9afbf','#b96e83','#a8b49a','#a7b9ca','#d3b081','#aa9bcc','#f4d273','#704d63','#ffffff'];
  function clearDrafts(){for(const k of Object.keys(W.specs))try{localStorage.removeItem(prefix+k);}catch{}}
  function open(kind,state,onApply){
    if(document.querySelector('#wear-painter'))return;const spec=W.specs[kind];if(!spec)return;
    const saved=state.customDesigns[kind],base=JSON.stringify(saved||null);let data=saved?W.copy(saved):W.template(kind,state.outfitColor),restored=false,storageOK=true;
    try{const draft=JSON.parse(localStorage.getItem(prefix+kind));if(draft?.base===base){const valid=W.normalize(kind,draft.data,true);if(valid){data=valid;restored=true;}}}catch{storageOK=false;}
    let undo=[],redo=[],tool='pen',ink=state.outfitColor,size=1,mirror=false,grid=true,drawing=false,last=null,paletteFull=false,cursor=[Math.floor(spec.cols/2),Math.floor(spec.rows/2)];
    const dialog=document.createElement('dialog');dialog.id='wear-painter';dialog.className='wear-painter';dialog.setAttribute('aria-labelledby','paint-title');
    dialog.innerHTML=`<header class="paint-header"><div><span class="eyebrow">LITTLE PIXELS, BIG FEELINGS</span><h2 id="paint-title">วาด${spec.label}ให้เจ้าตัวเล็ก <span>♡</span></h2></div><button class="paint-close" aria-label="ปิดห้องวาด">×</button></header><div class="paint-body"><aside class="paint-preview"><div class="paint-preview-stage"><span class="paint-tape"></span><span class="paint-preview-label">ลองใส่ให้ดูแล้วนะ</span><canvas width="200" height="216" id="paint-doll" aria-label="ตัวอย่างตุ๊กตาใส่ชิ้นที่กำลังวาด"></canvas><span class="paint-handwritten">made by you ♡</span></div><p>แต่ละพิกเซล คือความตั้งใจของคุณ</p><div class="paint-tips">✦ วาดทับภาพจาง ๆ ให้พอดีกับตัว<br>✦ ช่องลายหมากรุกคือพื้นโปร่งใส<br>✦ ชิ้นนี้จะอยู่ในของขวัญและภาพ PNG</div></aside><section class="paint-studio" aria-label="เครื่องมือวาดพิกเซล"><div class="paint-toolbar" role="group" aria-label="เครื่องมือ"><button data-paint-tool="pen" aria-pressed="true">✎ ดินสอ</button><button data-paint-tool="eraser" aria-pressed="false">◇ ยางลบ</button><button data-paint-tool="fill" aria-pressed="false">▨ เทสี</button><span class="paint-toolbar-spacer"></span><button id="paint-undo" aria-label="ย้อนกลับการวาด" title="ย้อนกลับ (Ctrl/⌘ Z)">↶</button><button id="paint-redo" aria-label="ทำซ้ำการวาด" title="ทำซ้ำ (Ctrl/⌘ Shift Z)">↷</button></div><div class="paint-canvas-wrap"><canvas id="paint-grid" width="${spec.cols*16}" height="${spec.rows*16}" tabindex="0" role="application" aria-label="กริดวาด${spec.label} ${spec.cols} คูณ ${spec.rows} ช่อง ใช้ปุ่มลูกศรเลื่อน และ Space วาด" aria-describedby="paint-keyboard-help"></canvas></div><div class="paint-settings"><label>ขนาดพู่กัน <select id="paint-size" aria-label="ขนาดพู่กัน"><option value="1">1 px</option><option value="2">2 px</option><option value="3">3 px</option></select></label><label><input id="paint-mirror" type="checkbox"> วาดสมมาตร</label><label><input id="paint-grid-toggle" type="checkbox" checked> เส้นกริด</label></div><div class="paint-palette-heading"><strong>สีที่อยากเติม</strong><label class="paint-custom-color"><input id="paint-color" type="color" value="${ink}" aria-label="เลือกสีวาดเอง"><span id="paint-hex">${ink}</span></label></div><div class="paint-swatches" aria-label="สีแนะนำ">${swatches.map(c=>`<button data-paint-color="${c}" style="--ink:${c}" aria-label="สีวาด ${c}" aria-pressed="${ink===c}"></button>`).join('')}</div><div class="paint-used-line"><span>สีในชิ้นนี้ <b id="paint-color-count"></b>/16</span><div id="paint-used" class="paint-swatches"></div></div><div class="paint-bottom-tools"><button id="paint-template">✿ ใช้โครงเริ่มต้น</button><button id="paint-clear">ล้างผืนวาด</button></div><p id="paint-keyboard-help" class="paint-keyboard-help">คีย์บอร์ด: ลูกศรเลื่อน · Space วาด · Ctrl/⌘ Z ย้อนกลับ</p></section></div><footer class="paint-footer"><p id="paint-status" role="status"></p><button id="paint-apply" class="primary-button">ใช้${spec.label}ชิ้นนี้ <span>♡</span></button></footer>`;
    document.body.append(dialog);const $=s=>dialog.querySelector(s),canvas=$('#paint-grid'),c=canvas.getContext('2d'),ref=document.createElement('canvas');ref.width=200;ref.height=216;P.draw(ref,{...state,[kind]:'none'},{bouquetVisible:false});
    function status(text){$('#paint-status').textContent=text;}
    function persist(){try{localStorage.setItem(prefix+kind,JSON.stringify({base,data}));storageOK=true;}catch{storageOK=false;}status(paletteFull?'ชิ้นนี้ใช้ครบ 16 สีแล้ว ลบสีที่ไม่ใช้หรือเลือกสีเดิมก่อนนะ':storageOK?'เก็บแบบร่างการวาดในเครื่องแล้ว ✓':'เก็บแบบร่างในหน้านี้เท่านั้น');}
    function snapshot(){undo.push(W.copy(data));if(undo.length>30)undo.shift();redo=[];}
    function render(){
      c.imageSmoothingEnabled=false;c.clearRect(0,0,canvas.width,canvas.height);
      for(let y=0;y<spec.rows;y++)for(let x=0;x<spec.cols;x++){c.fillStyle=(x+y)%2?'#eee5de':'#fffaf5';c.fillRect(x*16,y*16,16,16);}
      c.globalAlpha=.28;c.drawImage(ref,spec.x+30,spec.y+12,spec.cols*3,spec.rows*3,0,0,canvas.width,canvas.height);c.globalAlpha=1;
      [...data.pixels].forEach((v,i)=>{if(v!=='.'){c.fillStyle=data.palette[parseInt(v,16)];c.fillRect(i%spec.cols*16,Math.floor(i/spec.cols)*16,16,16);}});
      if(grid){c.strokeStyle='#80695d28';c.lineWidth=1;c.beginPath();for(let x=0;x<=spec.cols;x++){c.moveTo(x*16+.5,0);c.lineTo(x*16+.5,canvas.height);}for(let y=0;y<=spec.rows;y++){c.moveTo(0,y*16+.5);c.lineTo(canvas.width,y*16+.5);}c.stroke();}
      if(document.activeElement===canvas){c.strokeStyle='#664659';c.lineWidth=2;c.strokeRect(cursor[0]*16+2,cursor[1]*16+2,12,12);}
      const layer=W.normalize(kind,data);P.draw($('#paint-doll'),{...state,[kind]:'custom',customDesigns:{...state.customDesigns,[kind]:data}},{bouquetVisible:false});
      $('#paint-apply').disabled=!layer;$('#paint-undo').disabled=!undo.length;$('#paint-redo').disabled=!redo.length;$('#paint-color-count').textContent=data.palette.length;
      $('#paint-used').innerHTML=data.palette.map(color=>`<button data-paint-color="${color}" style="--ink:${color}" aria-label="ใช้สีในชิ้นนี้ ${color}" aria-pressed="${ink===color}"></button>`).join('');
      dialog.querySelectorAll('[data-paint-color]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.paintColor===ink)));
      dialog.querySelectorAll('[data-paint-tool]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.paintTool===tool)));
    }
    function applyStroke(points,fill=false){const next=W.stroke(kind,data,points,tool==='eraser'?null:ink,{size,mirror,fill});if(!next){paletteFull=true;status('ชิ้นนี้ใช้ครบ 16 สีแล้ว ลบสีที่ไม่ใช้หรือเลือกสีเดิมก่อนนะ');return false;}paletteFull=false;data=next;render();return true;}
    function at(e){const r=canvas.getBoundingClientRect();return [Math.max(0,Math.min(spec.cols-1,Math.floor((e.clientX-r.left)/r.width*spec.cols))),Math.max(0,Math.min(spec.rows-1,Math.floor((e.clientY-r.top)/r.height*spec.rows)))];}
    canvas.addEventListener('pointerdown',e=>{if(e.button!==0)return;e.preventDefault();canvas.focus({preventScroll:true});snapshot();cursor=last=at(e);drawing=true;canvas.setPointerCapture(e.pointerId);applyStroke([last],tool==='fill');});
    canvas.addEventListener('pointermove',e=>{if(!drawing||tool==='fill')return;const point=at(e);cursor=point;applyStroke(W.line(last,point));last=point;});
    function end(){if(!drawing)return;drawing=false;last=null;persist();}
    canvas.addEventListener('pointerup',end);canvas.addEventListener('pointercancel',end);canvas.addEventListener('lostpointercapture',end);
    function history(back){const source=back?undo:redo,target=back?redo:undo;if(!source.length)return;target.push(W.copy(data));data=source.pop();persist();render();}
    dialog.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();history(!e.shiftKey);}else if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='y'){e.preventDefault();history(false);}});
    canvas.addEventListener('keydown',e=>{const moves={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};if(moves[e.key]){e.preventDefault();const [x,y]=moves[e.key];cursor=[Math.max(0,Math.min(spec.cols-1,cursor[0]+x)),Math.max(0,Math.min(spec.rows-1,cursor[1]+y))];render();}else if(e.code==='Space'||e.key==='Enter'){e.preventDefault();snapshot();applyStroke([cursor],tool==='fill');persist();}});
    canvas.addEventListener('focus',render);canvas.addEventListener('blur',render);
    $('#paint-size').addEventListener('change',e=>{size=Number(e.target.value);});$('#paint-mirror').addEventListener('change',e=>{mirror=e.target.checked;});$('#paint-grid-toggle').addEventListener('change',e=>{grid=e.target.checked;render();});
    function chooseColor(color){paletteFull=false;ink=color;$('#paint-color').value=ink;$('#paint-hex').textContent=ink;if(tool==='eraser')tool='pen';render();}
    $('#paint-color').addEventListener('input',e=>chooseColor(e.target.value));
    dialog.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.paintTool){tool=b.dataset.paintTool;render();}if(b.dataset.paintColor)chooseColor(b.dataset.paintColor);});
    $('#paint-undo').addEventListener('click',()=>history(true));$('#paint-redo').addEventListener('click',()=>history(false));
    $('#paint-template').addEventListener('click',()=>{snapshot();data=W.template(kind,ink);persist();render();});
    $('#paint-clear').addEventListener('click',()=>{snapshot();data=W.blank(kind);persist();render();status('ผืนวาดว่างแล้ว · กดย้อนกลับเพื่อคืนลายเดิมได้');});
    $('.paint-close').addEventListener('click',()=>dialog.close());
    $('#paint-apply').addEventListener('click',()=>{const layer=W.normalize(kind,data);if(!layer)return;try{localStorage.removeItem(prefix+kind);}catch{}onApply(layer);dialog.close('applied');});
    dialog.addEventListener('close',()=>{if(dialog.returnValue!=='applied')persist();dialog.remove();});
    dialog.showModal();render();status(restored?'ต่อจากแบบร่างการวาดครั้งก่อน ♡':'เริ่มจากโครงน่ารัก ๆ หรือกดล้างเพื่อวาดใหม่ได้เลย');
  }
  window.WearPainter={open,clearDrafts};
})();
