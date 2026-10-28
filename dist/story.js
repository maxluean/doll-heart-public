/* Canvas stationery composition, rendered in the browser without uploads. */
(() => {
  'use strict';
  const graphemes=text=>window.DollHeart?.chars(text)||Array.from(String(text));
  const words=typeof Intl.Segmenter==='function'?new Intl.Segmenter('th',{granularity:'word'}):null;
  function linesFor(c,text,width){
    const lines=[];
    for(const paragraph of String(text).split('\n')){
      const chunks=words?[...words.segment(paragraph)].map(p=>p.segment):graphemes(paragraph);let line='';
      for(const chunk of chunks){
        if(c.measureText(line+chunk).width<=width){line+=chunk;continue;}
        if(line.trim())lines.push(line.trimEnd());line='';
        if(c.measureText(chunk).width<=width){line=chunk.trimStart();continue;}
        for(const ch of graphemes(chunk)){if(line&&c.measureText(line+ch).width>width){lines.push(line);line='';}line+=ch;}
      }
      if(line||!paragraph)lines.push(line.trimEnd());
    }return lines.length?lines:[''];
  }
  function fitted(c,text,box){
    const family=box.family||'Mali',weight=box.weight||500;let size=box.size||28,value=String(text).replace(/\r\n/g,'\n');
    if(value.split('\n').length>6)value=value.replace(/\s+/g,' ').trim();
    let lines,lineHeight;
    for(;size>=8;size--){
      c.font=`${weight} ${size}px "${family}", Tahoma, sans-serif`;lines=linesFor(c,value,box.width);lineHeight=Math.ceil(size*(box.leading||1.42));
      if(lines.length*lineHeight<=box.height)break;
      if(size===(box.min||17)&&value.includes('\n'))return fitted(c,value.replace(/\s+/g,' ').trim(),box);
    }
    return {lines,size,lineHeight,height:lines.length*lineHeight,font:`${weight} ${size}px "${family}", Tahoma, sans-serif`};
  }
  function text(c,value,box){
    c.save();const layout=fitted(c,value,box);c.font=layout.font;c.fillStyle=box.color||'#75574f';
    // Explicit left origins avoid platform-dependent centered Thai text placement.
    c.textAlign='left';c.direction='ltr';c.textBaseline='alphabetic';
    const left=box.align==='center'?box.x-box.width/2:box.align==='right'?box.x-box.width:box.x;
    c.beginPath();c.rect(left,box.y-8,box.width,box.height+16);c.clip();
    layout.lines.forEach((line,i)=>{const width=c.measureText(line).width;
      const x=box.align==='center'?box.x-width/2:box.align==='right'?box.x-width:box.x;
      c.fillText(line,x,box.y+layout.size+i*layout.lineHeight,box.width);
    });c.restore();return layout;
  }
  function round(c,x,y,w,h,r,fill,stroke){c.beginPath();c.roundRect(x,y,w,h,r);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=1.5;c.stroke();}}
  function paper(c,x,y,w,h,r=18){c.save();c.shadowColor='#8e5c4522';c.shadowBlur=25;c.shadowOffsetY=10;round(c,x,y,w,h,r,'#fffdf7');c.restore();round(c,x,y,w,h,r,null,'#ead5c7');}
  function tape(c,x,y,rotation){c.save();c.translate(x,y);c.rotate(rotation);c.fillStyle='#dec6a988';c.fillRect(-57,-16,114,32);c.fillStyle='#fff6dd44';for(let i=-54;i<57;i+=7)c.fillRect(i,-16,3,32);c.restore();}
  function star(c,x,y,color='#d3ad7e',s=1){c.save();c.translate(x,y);c.scale(s,s);c.strokeStyle=color;c.lineWidth=1.5;c.beginPath();c.moveTo(0,-13);c.quadraticCurveTo(3,-3,13,0);c.quadraticCurveTo(3,3,0,13);c.quadraticCurveTo(-3,3,-13,0);c.quadraticCurveTo(-3,-3,0,-13);c.stroke();c.restore();}
  function privacyView(gift,privacy={}){
    const hiddenNames=[privacy.hideFrom===true?gift.from:'',privacy.hideTo===true?gift.to:''].filter(name=>name?.trim()).sort((a,b)=>b.length-a.length);
    const redact=value=>hiddenNames.reduce((result,name)=>result.split(name).join('•••'),String(value||''));
    // Each name label has its own switch, even when the two names overlap or match.
    return {...gift,from:privacy.hideFrom===true?'ใครบางคน':gift.from,to:privacy.hideTo===true?'คนพิเศษ':gift.to,name:redact(gift.name),songTitle:redact(gift.songTitle),title:privacy.hideLetter===true?'':redact(gift.title),message:privacy.hideLetter===true?'':redact(gift.message)};
  }
  function lockedLetter(c){
    // A small 14 × 17 sprite, kept on whole pixels in both preview and PNG.
    const lock=[
      '.....oooo.....',
      '....ohhhho....',
      '...oh....ho...',
      '...oh....ho...',
      '...oh....ho...',
      '...oh....ho...',
      '.oooooooooooo.',
      'ohhhhhhhhhhhho',
      'ohppppppppppso',
      'ohppppppppppso',
      'ohppppkkppppso',
      'ohppppkkppppso',
      'ohppppkkppppso',
      'ohppppppppppso',
      'ohppppppppppso',
      '.osssssssssso.',
      '..oooooooooo..'
    ],palette={o:'#b77d91',h:'#fff4f3',p:'#f5dce4',s:'#dfb5c4',k:'#aa7286'};
    c.save();lock.forEach((row,y)=>[...row].forEach((pixel,x)=>{if(palette[pixel]){c.fillStyle=palette[pixel];c.fillRect(512+x*4,1180+y*4,4,4);}}));c.restore();
    text(c,'จดหมายนี้เป็นความลับ',{x:540,y:1273,width:820,height:45,size:30,weight:600,align:'center',color:'#9d6577'});
    text(c,'เก็บไว้อ่านกันสองคน ♡',{x:540,y:1324,width:820,height:34,size:23,family:'Itim',align:'center',color:'#ad8b7b'});
  }
  async function render(gift,privacy={}){
    // Redact before layout or drawing: private words never enter canvas commands.
    const s=privacyView(gift,privacy),hideLetter=privacy.hideLetter===true;
    await Promise.allSettled([document.fonts.load('500 28px Mali'),document.fonts.load('600 36px Mali'),document.fonts.load('400 22px Itim')]);await document.fonts.ready;
    const P=window.PixelLove,B=window.Bouquet,canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1920;
    const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;
    const bg=c.createLinearGradient(0,0,1080,1920);bg.addColorStop(0,'#f7e2df');bg.addColorStop(.4,'#fff5e9');bg.addColorStop(1,'#f6e8df');c.fillStyle=bg;c.fillRect(0,0,1080,1920);
    const glow=c.createRadialGradient(160,300,10,160,300,850);glow.addColorStop(0,'#fffaf3aa');glow.addColorStop(1,'#fffaf300');c.fillStyle=glow;c.fillRect(0,0,1080,1920);
    c.strokeStyle='#d8b9a68c';c.lineWidth=1.5;c.setLineDash([3,10]);c.beginPath();c.roundRect(34,34,1012,1852,26);c.stroke();c.setLineDash([]);
    // A deterministic paper grain, identical in previews and downloads.
    c.fillStyle='#a9775a0b';for(let i=0;i<1000;i++){const x=(i*379+17)%1080,y=(i*631+53)%1920;c.fillRect(x,y,i%3===0?2:1,1);}
    text(c,'a pocket full of love',{x:540,y:66,width:800,height:40,size:21,family:'Itim',align:'center',color:'#b78086'});
    text(c,`${s.from||'เรา'}  ♡  ${s.to||'เธอ'}`,{x:540,y:110,width:860,height:114,size:44,min:27,weight:600,align:'center',color:'#72514d',leading:1.25});
    P.heart(c,108,139,'#ce94a0',2);star(c,957,159,'#c5a37b',1.1);
    // Tilted polaroid: the selected scene and the same modular pixel doll.
    c.save();c.translate(540,660);c.rotate(-.018);c.translate(-540,-660);
    paper(c,70,258,940,818,18);
    c.save();c.beginPath();c.roundRect(92,280,896,716,10);c.clip();c.translate(92,280);P.scene(c,s.background,896,716);c.restore();
    c.save();c.textAlign='left';c.fillStyle='#b78b77';c.font='italic 34px Georgia,serif';c.fillText('a hug for you,',128,347);c.font='italic 23px Georgia,serif';c.fillText('and a little love too.',131,383);c.restore();
    const doll=document.createElement('canvas');doll.width=200;doll.height=216;P.draw(doll,s);c.save();c.beginPath();c.roundRect(92,280,896,716,10);c.clip();c.drawImage(doll,160,250,760,821);c.restore();
    const specials=window.LoveCatalog.specialLabels(s);
    specials.forEach((label,i)=>{c.save();c.font='600 19px Mali';const width=Math.ceil(c.measureText(label).width)+36,x=964-width,y=304+i*49;round(c,x,y,width,38,19,'#fff5ee','#d7a9b7');text(c,label,{x:x+18,y:y+5,width:width-36,height:29,size:19,weight:600,color:'#8d5068',leading:1});c.restore();});
    P.heart(c,865,specials.length?439:380,'#c68f9f',4);star(c,166,783,'#b99876',1.2);star(c,921,847,'#c5a37b',.9);
    text(c,`✿ ${s.name||'เจ้าตัวเล็ก'}`,{x:540,y:1008,width:820,height:45,size:26,align:'center',color:'#ae7385'});
    tape(c,280,263,-.07);tape(c,829,1065,-.08);c.restore();
    // The letter has its own piece of paper rather than floating on the page.
    paper(c,76,1102,928,300,17);c.save();c.strokeStyle='#e7c7bc';c.setLineDash([3,6]);c.beginPath();c.moveTo(104,1148);c.lineTo(975,1148);c.stroke();c.restore();
    text(c,'a note from my heart',{x:112,y:1118,width:760,height:30,size:19,family:'Itim',color:'#ba8e7c'});P.heart(c,934,1125,'#cb8999',2);
    if(hideLetter)lockedLetter(c);
    else{
    const titleBox={width:820,height:92,size:32,min:23,weight:600,leading:1.35},titleFit=fitted(c,s.title,titleBox);
    const messageBox={width:824,height:220-titleFit.height-13,size:28,min:20,leading:1.47},messageFit=fitted(c,s.message,messageBox);
    const letterY=1160+Math.max(0,(220-titleFit.height-13-messageFit.height)/2);
    text(c,s.title,{...titleBox,x:540,y:letterY,align:'center',color:'#78564e'});
    text(c,s.message,{...messageBox,x:540,y:letterY+titleFit.height+13,align:'center',color:'#937265'});
    }
    // Species and color meanings come from the shared catalogue.
    const list=s.flowers.map(B.describe);paper(c,76,1425,928,339,17);
    text(c,'ความหมายเล็ก ๆ ที่ซ่อนอยู่ในช่อนี้',{x:112,y:1440,width:810,height:42,size:25,weight:600,color:'#9d6577'});
    const rowH=264/list.length;
    list.forEach((d,i)=>{const top=1490+i*rowH,cy=top+rowH/2-6;
      const tint=c.createLinearGradient(100,top,970,top);tint.addColorStop(0,d.color.hex+'35');tint.addColorStop(1,'#fff9f200');round(c,98,top,884,rowH-7,12,tint);
      c.save();c.translate(141,Math.round(cy));c.scale(list.length===1?2.7:1.8,list.length===1?2.7:1.8);P.bloom(c,d.flower.id,0,0,d.color.hex);c.restore();
      const titleY=cy-34;text(c,`${d.flower.name} · ${d.color.label}`,{x:192,y:titleY,width:748,height:36,size:list.length===1?28:25,min:19,weight:600,color:'#815e56',leading:1.2});
      const detail=`ดอกไม้: ${d.flower.meaning} · สี: ${d.color.meaning}`;text(c,detail,{x:192,y:cy-3,width:746,height:rowH/2+14,size:list.length===3?22:24,min:16,family:'Itim',color:'#9a7a6b',leading:1.16});
    });
    // A small music ticket keeps the bottom balanced with or without a song.
    round(c,130,1791,820,64,17,'#fbeee5','#dfc5b5');
    text(c,s.musicUrl&&s.songTitle?`♫ ${s.songTitle}`:'♡ ขอบคุณที่เป็นคนพิเศษของกันและกัน',{x:540,y:1805,width:746,height:41,size:23,min:17,align:'center',color:'#ad7f80',leading:1.1});
    text(c,'ความในใจภายในตุ๊กตา  ·  made with a little love',{x:540,y:1860,width:920,height:32,size:17,family:'Itim',align:'center',color:'#b19383'});
    return canvas;
  }
  window.StoryCard={render,linesFor,fitted,drawText:text,privacyView};
})();
