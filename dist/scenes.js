/* Original pixel scenery. The shop, gift and PNG share this renderer. */
(() => {
  'use strict';
  const P=window.PixelLove,baseScene=P.scene;
  const richIds=new Set(['glasshouse','sunset-picnic','cozy-room','sakura-lantern','starlight-rooftop']);
  function richScene(c,id,w,h){
    if(!richIds.has(id)){baseScene(c,id,w,h);return;}
    c.save();c.imageSmoothingEnabled=false;c.scale(w/320,h/280);
    const r=(x,y,w,h,color)=>P.rect(c,x,y,w,h,color);
    const poly=(points,color)=>{c.fillStyle=color;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();};
    const gradient=(top,bottom,end=280)=>{const g=c.createLinearGradient(0,0,0,end);g.addColorStop(0,top);g.addColorStop(1,bottom);r(0,0,320,280,g);};
    const line=(points,color,width=1)=>{c.strokeStyle=color;c.lineWidth=width;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();};
    const star=(x,y,s=1,color='#fff0bc')=>{r(x,y,2*s,6*s,color);r(x-2*s,y+2*s,6*s,2*s,color);};
    const pot=(x,y,s=1,flowers=false)=>{c.save();c.translate(x,y);c.scale(s,s);r(-9,-1,18,4,'#d8ac8e');poly([[-7,3],[7,3],[5,17],[-5,17]],'#bf8f76');r(-5,5,3,10,'#d7ac8d');r(-1,-23,2,23,'#8c9b76');[[-7,-18],[6,-24],[-10,-8],[7,-11]].forEach(([a,b],i)=>{r(Math.min(0,a),b,Math.abs(a),2,'#8d9e78');poly([[a,b],[a-4,b-6],[a+3,b-5],[a+5,b]],i%2?'#aaba91':'#8fa783');if(flowers)P.bloom(c,'daisy',a,b-5,i%2?'#f3d5bb':'#d9a0b0',.3);});c.restore();};
    const fairyLights=(points)=>{line(points,'#978879',1);for(let i=0;i<points.length-1;i++){const [x,y]=points[i],[a,b]=points[i+1];for(let t=.15;t<1;t+=.3){const px=Math.round(x+(a-x)*t),py=Math.round(y+(b-y)*t);r(px-3,py+2,7,7,'#fff1c52a');r(px-1,py+2,3,4,'#fff0c7');}}};
    const books=(x,y)=>{[['#b98791',16],['#a9b9a1',22],['#d4b081',19],['#b5a8c4',15]].forEach(([color,height],i)=>{r(x+i*6,y-height,5,height,color);r(x+i*6+1,y-height+3,3,1,'#fff2dd');});};
    const mug=(x,y)=>{r(x,y,9,8,'#f9ead9');r(x+8,y+2,4,4,'#e7c8ad');r(x+9,y+3,2,2,'#faf2dd');r(x+1,y-1,7,2,'#987561');r(x+3,y-7,1,4,'#fff9df99');};
    const lantern=(x,y)=>{r(x,y,1,12,'#a7897b');r(x-5,y+12,11,3,'#ba8b87');r(x-7,y+15,15,14,'#e6a7a4');r(x-4,y+15,2,14,'#f2c5ab');r(x+3,y+15,2,14,'#c88e91');r(x-5,y+29,11,3,'#b28283');r(x,y+32,1,6,'#c99586');};
    const pillow=(x,y,color)=>{r(x+2,y,24,13,color);r(x,y+2,28,9,color);r(x+3,y+2,22,2,'#fff2df55');r(x+3,y+11,22,2,'#a07c7233');};
    if(id==='glasshouse'){
      gradient('#dce6da','#f4ecdc');
      // Glass roof, garden beyond, shelving and hanging planters.
      r(0,133,320,89,'#c8d7b9');for(let i=0;i<12;i++){const x=i*30-12,y=128+(i%3)*9;poly([[x,181],[x+3,y+10],[x+14,y],[x+27,y+9],[x+31,181]],i%2?'#b4c9a9':'#bacdad');}
      poly([[0,77],[160,2],[320,77],[320,89],[160,16],[0,89]],'#a3b3a2');
      for(const x of [14,75,160,245,306]){r(x,55,4,167,'#a4b6a6');r(x+1,57,1,163,'#e4eadb');}
      r(0,107,320,3,'#a5b6a1');r(0,174,320,4,'#b2beaa');line([[13,76],[160,8],[307,76]],'#eaf0e5',2);
      for(const x of [75,245])line([[160,9],[x,65]],'#b0beb0',3);
      r(0,222,320,58,'#e1d4bd');for(let y=230;y<280;y+=17)r(0,y,320,1,'#cdbfa7');for(let x=0;x<320;x+=48)r(x,222,1,58,'#d1c4ad');
      r(5,153,67,5,'#b79575');r(9,157,3,65,'#ad8d73');r(65,157,3,65,'#ad8d73');pot(24,140,.85,true);pot(53,142,.72);books(18,202);r(5,203,67,4,'#b79575');
      for(const x of [29,290]){line([[x-12,25],[x,60],[x+12,25]],'#9ea78c');pot(x,60,.8,true);}
      pot(286,211,1.65,true);pot(256,225,.95);pot(39,235,1.1,true);
      r(250,178,52,4,'#b99a7d');r(255,182,3,43,'#b99a7d');r(296,182,3,43,'#b99a7d');mug(273,170);
      // Watering can and seed packets beside the stone path.
      r(61,238,18,13,'#a8b7a5');r(64,234,11,5,'#bccbb6');poly([[78,241],[91,232],[94,234],[80,248]],'#a8b7a5');line([[63,239],[57,236],[57,249],[64,248]],'#93a691',2);
      poly([[111,280],[135,222],[184,222],[212,280]],'#f0e7d4');for(let y=234;y<280;y+=16)r(124-(y-234)/3,y,73+(y-234)/1.5,1,'#d8cfba');
      fairyLights([[0,28],[80,44],[160,34],[240,44],[320,28]]);
    }else if(id==='sunset-picnic'){
      gradient('#dab6ca','#f6d6b4',180);
      r(244,45,29,29,'#f8dfbb');r(238,53,41,14,'#f8dfbb');
      [[21,40,45],[187,26,30],[92,69,36]].forEach(([x,y,a])=>{r(x,y,a,4,'#f6dfd5');r(x+8,y-3,a-17,3,'#f6dfd5');});
      r(0,126,320,86,'#aebfc2');r(0,126,320,3,'#edd4c0');for(let i=0;i<40;i++){const x=(i*71)%320,y=134+(i*19)%67;r(x,y,9+(i%4)*4,1,i%2?'#d7d7c8':'#8faeb4');}
      for(let y=135;y<198;y+=9)r(247-(y-135)/5,y,23+(y-135)/2,2,'#f4ddbc99');
      poly([[0,197],[68,189],[154,200],[258,188],[320,194],[320,280],[0,280]],'#e8d4b8');r(0,220,320,1,'#d8c5ab');
      // Striped umbrella, deck chair, shell trail and a fully laid picnic.
      r(43,95,3,139,'#aa8e79');poly([[7,106],[44,66],[84,106]],'#cc959f');poly([[7,106],[27,84],[32,106]],'#f4d9cc');poly([[44,66],[62,86],[63,106],[43,106]],'#f4d9cc');
      line([[20,182],[34,219],[65,219],[73,186]],'#b2937e',3);poly([[19,182],[28,177],[52,205],[33,207]],'#c39da0');r(32,205,34,5,'#dfb6b1');line([[36,211],[27,237]],'#a58a73',3);line([[61,212],[71,236]],'#a58a73',3);
      poly([[96,236],[228,236],[256,280],[71,280]],'#f3e4d2');for(let i=0;i<6;i++)poly([[99+i*23,236],[107+i*23,236],[91+i*29,280],[81+i*29,280]],'#dca8a542');for(let y=241;y<280;y+=13)r(87,y,151,5,'#dca8a542');
      r(250,221,35,24,'#bb9473');r(252,223,31,4,'#d9b48b');for(let x=253;x<283;x+=5)r(x,228,2,15,'#d3ac86');line([[257,221],[257,213],[278,213],[278,221]],'#b28b6b',3);
      r(276,203,5,17,'#b3bba4');r(274,215,9,7,'#d3b5a1');P.bloom(c,'daisy',278,197,'#f6ecd4',.5);
      mug(113,247);mug(133,250);r(167,246,23,9,'#ead8ba');r(170,244,18,5,'#be8e79');r(171,247,16,2,'#e5ba88');
      for(const [x,y] of [[18,252],[298,243],[275,266],[65,253]]){r(x,y,6,3,'#f8ead5');r(x+2,y-2,2,6,'#d6b1a2');}
      line([[279,90],[284,88],[289,91]],'#9f8592');line([[295,82],[299,80],[303,82]],'#9f8592');
      for(const x of [6,306]){r(x,200,2,44,'#a6a587');line([[x,218],[x-7,207]],'#a6a587',2);line([[x,228],[x+9,215]],'#a6a587',2);}
    }else if(id==='cozy-room'){
      r(0,0,320,280,'#eee0d0');r(0,0,320,8,'#c7b49d');for(let x=0;x<320;x+=16)r(x,9,1,202,'#e1d0bd');
      r(103,30,113,138,'#bda78d');r(109,36,101,126,'#c6b9d2');r(115,42,89,114,'#d7c9da');r(124,46,17,3,'#eee3da');star(186,64,.65);r(112,95,95,4,'#f4e4d1');r(157,38,4,120,'#f4e4d1');
      poly([[93,27],[120,27],[114,171],[87,171]],'#c7969c');poly([[198,27],[224,27],[231,171],[204,171]],'#c7969c');r(95,33,4,128,'#dfb5b4');r(215,33,4,128,'#dfb5b4');r(90,125,25,5,'#b58789');r(206,125,22,5,'#b58789');
      r(0,211,320,69,'#c5a88c');for(let y=220;y<280;y+=18)r(0,y,320,1,'#ae917a');for(let x=0;x<320;x+=60)r(x,211,1,69,'#b99b80');
      r(8,45,60,148,'#aa8c75');r(12,49,52,140,'#e3d0b9');for(const y of [87,126,165]){r(10,y,56,5,'#a98c73');books(18,y);}
      pot(42,42,.7);r(42,106,14,16,'#c2af9b');r(46,109,6,9,'#f6e6c8');
      // Fireplace, candles, picture frames and warm reading corner.
      r(254,149,57,64,'#d4b89e');r(249,144,66,7,'#b39177');r(264,165,36,48,'#8d7568');r(269,184,26,28,'#b98768');poly([[273,210],[275,192],[283,180],[284,197],[291,187],[295,211]],'#e5b77c');poly([[279,211],[284,197],[288,211]],'#f7db9a');
      for(const [x,y] of [[257,132],[302,135]]){r(x,y,4,12,'#f8e7c5');r(x+1,y-4,2,3,'#eac288');}r(277,111,17,26,'#b48c74');r(279,113,13,22,'#ead0ba');P.heart(c,281,118,'#be8d97',1);
      r(248,225,59,22,'#bb8c96');r(243,214,67,14,'#c89ca5');r(245,225,7,27,'#a77983');r(303,225,7,27,'#a77983');pillow(263,209,'#e0bbaa');
      r(14,206,34,6,'#b8987e');r(29,183,3,24,'#a88d78');poly([[16,183],[24,164],[37,164],[45,183]],'#e5cdb0');r(18,183,25,2,'#d2b393');pot(64,231,.9,true);
      poly([[79,243],[224,243],[245,280],[60,280]],'#dac3b4');for(let y=250;y<280;y+=7)r(80,y,143,1,'#bfa49755');r(96,259,111,2,'#eee0c9');books(274,261);mug(248,258);
      fairyLights([[75,15],[157,25],[240,15]]);
    }else if(id==='sakura-lantern'){
      gradient('#d5c5d9','#f2d8cc');
      poly([[0,142],[54,125],[91,143],[142,123],[196,145],[260,123],[320,140],[320,224],[0,224]],'#b7b6b2');
      r(0,187,320,93,'#cfcebd');r(0,200,320,18,'#b9c7bd');r(0,211,320,2,'#dce1d0');
      // Garden stream and little footbridge, lanterns, tea and blossom boughs.
      poly([[0,232],[111,214],[188,226],[320,216],[320,253],[186,249],[99,240],[0,259]],'#a9bec1');for(let x=7;x<320;x+=39)r(x,236+(x%17),19,1,'#d3d7ce');
      line([[124,235],[130,227],[142,223],[162,223],[179,228],[184,237]],'#a88778',4);r(126,237,57,4,'#b79983');for(let x=131;x<183;x+=11)r(x,226,2,14,'#b99581');
      for(const [x,y] of [[16,233],[286,230]]){r(x,y,24,5,'#a7a895');r(x+4,y-24,16,24,'#bec0aa');poly([[x-3,y-23],[x+12,y-35],[x+27,y-23]],'#a6a895');r(x+8,y-20,8,10,'#f4d9a4');r(x+9,y-18,6,7,'#fae9be');r(x+7,y-2,10,3,'#a3a591');}
      const branch=(mirror=false)=>{c.save();if(mirror){c.translate(320,0);c.scale(-1,1);}poly([[0,0],[18,0],[25,112],[19,175],[5,196],[9,126]],'#9e827f');line([[17,77],[47,38],[81,27],[116,31]],'#9e827f',5);line([[17,55],[40,15],[71,6]],'#9e827f',4);line([[24,105],[57,75],[87,73]],'#a58b84',3);
        for(const [x,y,s] of [[13,9,1.3],[49,8,1.15],[83,17,1],[104,31,.7],[30,35,1],[55,51,1.1],[77,69,.85],[12,75,.9]]){c.save();c.translate(x,y);c.scale(s,s);r(-17,-9,34,18,'#dfb1c5');r(-12,-15,24,30,'#dfb1c5');r(-21,-4,42,8,'#dfb1c5');r(-13,-10,16,8,'#efc6d4');r(3,3,13,7,'#d9a4bb');for(let j=0;j<5;j++)P.bloom(c,'sakura',(j*13)%29-14,(j*17)%23-11,j%2?'#f3d2dc':'#e8b6cb',.24);c.restore();}
        c.restore();};branch();branch(true);
      fairyLights([[0,70],[80,91],[160,99],[240,91],[320,70]]);lantern(69,84);lantern(250,86);lantern(290,104);
      r(29,257,55,5,'#b29882');r(34,261,3,15,'#9d8575');r(76,261,3,15,'#9d8575');mug(39,249);mug(59,248);r(49,241,10,8,'#c29793');r(50,238,8,3,'#d9aba3');
      for(let i=0;i<42;i++){const x=(i*67+23)%320,y=224+(i*13)%54;r(x,y,3,2,i%2?'#eac2cd':'#d6a9bd');}
      pillow(254,262,'#cfadb7');
    }else{
      gradient('#8885a9','#d6b7cb',225);
      for(let i=0;i<46;i++){const x=(i*71+19)%320,y=(i*37+11)%165;if(i%5===0)star(x,y,.65);else r(x,y,1,1,'#f3e7d0');}
      r(241,29,24,24,'#f3deba');r(237,35,32,12,'#f3deba');r(234,24,24,21,'#8c87aa');
      // Skyline and a rooftop terrace full of little date-night props.
      for(let i=0;i<15;i++){const x=i*25-10,y=149+(i*17)%39;r(x,y,22,74,'#a3a0b3');r(x+4,y-4,13,5,'#a3a0b3');for(let yy=y+8;yy<214;yy+=12){r(x+5,yy,3,4,'#dbc6af');r(x+14,yy,3,4,'#d5c3b1');}}
      r(0,216,320,64,'#c3b1b2');for(let y=225;y<280;y+=17)r(0,y,320,1,'#af9ba3');for(let x=0;x<320;x+=41)r(x,216,1,64,'#b29ea6');
      r(0,185,320,4,'#928aa0');r(0,214,320,4,'#a098a9');for(let x=8;x<320;x+=24)r(x,188,3,29,'#9c94a8');
      fairyLights([[0,20],[80,40],[160,46],[240,40],[320,20]]);r(12,12,3,205,'#9f8c9b');r(304,12,3,205,'#9f8c9b');
      pot(27,208,1.2,true);pot(292,211,1.2);pot(64,235,.75);
      // Telescope with tripod and books, tea table, cushions and picnic rug.
      poly([[241,162],[267,143],[272,151],[246,171]],'#a59bb5');poly([[265,141],[276,134],[283,145],[272,154]],'#e1c7be');r(264,163,4,16,'#b6a5b4');line([[265,177],[251,220]],'#8f879e',3);line([[266,177],[281,220]],'#8f879e',3);line([[266,177],[266,221]],'#a59bad',2);
      r(20,245,52,5,'#aa8c89');r(26,250,3,19,'#aa8c89');r(63,250,3,19,'#aa8c89');mug(32,237);mug(49,236);books(14,243);
      poly([[91,247],[218,247],[243,280],[71,280]],'#e2c9cb');for(let x=95;x<222;x+=14)r(x,251,2,27,'#f0dfd6');pillow(251,247,'#b49bad');pillow(268,264,'#d4b4b6');
      r(297,250,9,18,'#d0ad8a');r(295,249,13,3,'#e5c5a3');r(300,252,3,12,'#f9dfaa');
      line([[104,67],[134,80]],'#f7e2c0',1);r(133,79,3,2,'#fff1d4');
    }
    c.restore();
  }
  function mountScene(element,id){
    if(!element?.querySelector)return;
    let canvas=element.querySelector('.scene-background');
    if(!canvas){canvas=document.createElement('canvas');canvas.className='scene-background';canvas.width=640;canvas.height=560;canvas.setAttribute('aria-hidden','true');element.prepend(canvas);}
    if(canvas.dataset.scene!==id){richScene(canvas.getContext('2d'),id,canvas.width,canvas.height);canvas.dataset.scene=id;}
    element.classList.add('scene-rendered');element.classList.toggle('scene-rich',richIds.has(id));
  }
  P.scene=richScene;P.mountScene=mountScene;
})();
