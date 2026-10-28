/* Bounded, portable pixel layers. No uploaded files or executable markup. */
(() => {
  'use strict';
  const specs={outfit:{x:22,y:103,cols:32,rows:20,label:'เสื้อ'},hat:{x:22,y:0,cols:32,rows:18,label:'หมวก'},glasses:{x:35,y:63,cols:24,rows:12,label:'แว่น'}};
  const digits='0123456789abcdef',valid=c=>typeof c==='string'&&/^#[0-9a-f]{6}$/i.test(c);
  function blank(kind){const s=specs[kind];return {v:1,palette:[],pixels:'.'.repeat(s.cols*s.rows)};}
  function normalize(kind,raw,allowEmpty=false){
    const s=specs[kind];if(!s||!raw||raw.v!==1||!Array.isArray(raw.palette)||raw.palette.length>16||!raw.palette.every(valid)||typeof raw.pixels!=='string'||raw.pixels.length!==s.cols*s.rows||!/^[.0-9a-f]+$/.test(raw.pixels))return null;
    const palette=[],map=new Map();let bad=false;
    const pixels=[...raw.pixels].map(v=>{if(v==='.')return v;const c=raw.palette[parseInt(v,16)]?.toLowerCase();if(!c){bad=true;return '.';}if(!map.has(c)){map.set(c,digits[palette.length]);palette.push(c);}return map.get(c);}).join('');
    return bad||(!allowEmpty&&!palette.length)?null:{v:1,palette,pixels};
  }
  function normalizeAll(raw){const out={};for(const kind of Object.keys(specs)){const layer=normalize(kind,raw?.[kind]);if(layer)out[kind]=layer;}return out;}
  const copy=d=>({v:1,palette:[...d.palette],pixels:d.pixels});
  function stroke(kind,raw,points,color,{size=1,mirror=false,fill=false}={}){
    let d=normalize(kind,raw,true);if(!d)return null;const s=specs[kind],cells=[...d.pixels];let ink='.';
    if(color!==null){if(!valid(color))return null;color=color.toLowerCase();let i=d.palette.indexOf(color);if(i<0){if(d.palette.length===16)return null;i=d.palette.push(color)-1;}ink=digits[i];}
    const put=(x,y)=>{if(x>=0&&x<s.cols&&y>=0&&y<s.rows)cells[y*s.cols+x]=ink;};
    if(fill){const [x,y]=points[0];if(x<0||x>=s.cols||y<0||y>=s.rows)return d;for(const start of mirror?[[x,y],[s.cols-1-x,y]]:[[x,y]]){const target=cells[start[1]*s.cols+start[0]];if(target===ink)continue;const queue=[start];while(queue.length){const [a,b]=queue.pop();if(a<0||a>=s.cols||b<0||b>=s.rows||cells[b*s.cols+a]!==target)continue;put(a,b);queue.push([a-1,b],[a+1,b],[a,b-1],[a,b+1]);}}}
    else for(const [x,y] of points)for(let a=0;a<size;a++)for(let b=0;b<size;b++){put(x+a,y+b);if(mirror)put(s.cols-1-x-a,y+b);}
    d.pixels=cells.join('');return normalize(kind,d,true);
  }
  function line(a,b){let [x,y]=a;const [u,v]=b,dx=Math.abs(u-x),dy=-Math.abs(v-y),sx=x<u?1:-1,sy=y<v?1:-1;let error=dx+dy;const points=[];for(;;){points.push([x,y]);if(x===u&&y===v)break;const e=2*error;if(e>=dy){error+=dy;x+=sx;}if(e<=dx){error+=dx;y+=sy;}}return points;}
  function template(kind,color='#c48e9b'){
    const s=specs[kind],d=blank(kind);d.palette=[color,'#80695d','#fff1df'];const cells=[...d.pixels];const rect=(x,y,w,h,ink)=>{for(let b=y;b<y+h;b++)for(let a=x;a<x+w;a++)if(a>=0&&a<s.cols&&b>=0&&b<s.rows)cells[b*s.cols+a]=ink;};
    if(kind==='outfit'){rect(5,1,21,3,'1');rect(2,4,27,7,'1');rect(5,7,21,11,'1');rect(6,2,19,15,'0');rect(3,5,25,5,'0');rect(12,1,7,3,'2');rect(6,15,19,2,'2');}
    else if(kind==='hat'){rect(7,7,17,1,'1');rect(4,8,23,7,'1');rect(2,12,27,4,'1');rect(5,9,21,5,'0');rect(3,13,25,2,'0');rect(15,6,2,2,'1');rect(6,11,19,1,'2');}
    else{for(const x of [2,14]){rect(x,2,8,1,'1');rect(x,9,8,1,'1');rect(x,3,1,6,'1');rect(x+7,3,1,6,'1');rect(x+1,3,6,1,'0');}rect(10,5,4,1,'1');rect(4,4,1,2,'2');rect(16,4,1,2,'2');}
    d.pixels=cells.join('');return normalize(kind,d);
  }
  function draw(c,kind,d,filter){const s=specs[kind];if(!s||!d)return;for(let y=0;y<s.rows;y++)for(let x=0;x<s.cols;x++){const v=d.pixels[y*s.cols+x];if(v==='.')continue;const px=s.x+x*3,py=s.y+y*3;if(filter&&!filter(px,py))continue;c.fillStyle=d.palette[parseInt(v,16)];c.fillRect(px,py,3,3);}}
  window.CustomWear={specs,blank,copy,normalize,normalizeAll,stroke,line,template,draw};
})();
