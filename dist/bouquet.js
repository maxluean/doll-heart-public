/* Owner-supplied flower symbolism, shared by editor, shop, recipient and PNG. */
(() => {
  'use strict';
  const tones=[
    {id:'pink',name:'ชมพู',meaning:'ความรักอ่อนโยน ความห่วงใย ความประทับใจ',swatch:'#d990a6'},
    {id:'red',name:'แดง',meaning:'ความรักที่ลึกซึ้ง ความหลงใหล ความกล้า',swatch:'#c95f72'},
    {id:'white',name:'ขาว',meaning:'ความบริสุทธิ์ ความจริงใจ การเริ่มต้นใหม่',swatch:'#fffdf8'},
    {id:'cream',name:'ครีม',meaning:'ความอบอุ่น ความละมุน ความอ่อนโยน',swatch:'#f3dfbc'},
    {id:'yellow',name:'เหลือง',meaning:'ความสุข มิตรภาพ กำลังใจ',swatch:'#e5bd63'},
    {id:'orange',name:'ส้ม',meaning:'ความกระตือรือร้น ความสดใส ความมั่นใจ',swatch:'#eaa47d'},
    {id:'purple',name:'ม่วง',meaning:'ความลึกซึ้ง ความสูงส่ง ความคิดถึง',swatch:'#b79ace'},
    {id:'blue',name:'ฟ้า',meaning:'ความสงบ ความไว้ใจ ความซื่อสัตย์',swatch:'#94b8d6'},
    {id:'green',name:'เขียว',meaning:'ความสดชื่น ความหวัง การเริ่มต้นใหม่',swatch:'#a6b88c'}
  ];
  const species={
    sunflower:{meaning:'ความศรัทธา ความจงรักภักดี พลังบวก',colors:{yellow:'ความสุข ความอบอุ่น กำลังใจ',orange:'พลังงาน ความกระตือรือร้น',red:'ความรักที่เข้มแข็ง ความมุ่งมั่น'}},
    hydrangea:{meaning:'ความซาบซึ้ง ความขอบคุณ ความรู้สึกที่หลากหลาย',colors:{pink:'ความรักอ่อนโยน ความจริงใจ',blue:'ความสงบ ความเข้าใจ การขอโทษ',purple:'ความเข้าใจลึกซึ้ง ความปรารถนาดี',white:'ความบริสุทธิ์ ความเรียบง่าย',green:'ความสดชื่น การเริ่มต้นใหม่'}},
    lily:{meaning:'ความบริสุทธิ์ ความสง่างาม',colors:{white:'ความบริสุทธิ์ จิตใจดีงาม',pink:'ความรักที่อ่อนโยน ความห่วงใย',yellow:'ความสนุกสนาน ความขอบคุณ',orange:'ความหลงใหล ความมั่นใจ',red:'ความรักที่ร้อนแรง'}},
    forget:{name:'ฟอร์เก็ตมีน็อท',meaning:'อย่าลืมฉัน ความรักที่ยั่งยืน ความทรงจำ',colors:{blue:'ความซื่อสัตย์ ความผูกพันที่ไม่เลือนหาย',pink:'ความรักอ่อนโยนที่คิดถึงเสมอ',white:'ความทรงจำที่บริสุทธิ์'}},
    peony:{meaning:'ความรุ่งเรือง ความมั่งคั่ง ความรักที่สมบูรณ์',colors:{pink:'ความรักโรแมนติก ความสุขในชีวิตคู่',red:'เกียรติยศ ความหลงใหล',white:'ความอายและความบริสุทธิ์ ความปรารถนาดี',cream:'ความอบอุ่น ความสง่างามแบบนุ่มนวล',yellow:'ความร่ำรวย ความสำเร็จ'}},
    lavender:{meaning:'ความสงบ ความผ่อนคลาย ความเงียบสงบในใจ',colors:{purple:'ความสงบ ความเชื่อใจ การเยียวยา',blue:'ความนิ่ง ความอ่อนโยน',white:'ความบริสุทธิ์ ความสงบสุข'}},
    carnation:{meaning:'ความรักและความชื่นชม (ดอกไม้วันแม่)',colors:{pink:'ความรักและความกตัญญูของลูกต่อแม่',red:'ความรักและความชื่นชมอย่างลึกซึ้ง',white:'ความรักบริสุทธิ์ ความโชคดี',yellow:'ความผิดหวัง (บางที่ตีความว่าความเป็นมิตร)',purple:'ความเอาแต่ใจ ความไม่แน่นอน',orange:'ความสดใส ความสนใจ'}},
    gerbera:{meaning:'ความร่าเริง ความบริสุทธิ์ ความสดใส',colors:{pink:'ความชื่นชม ความอ่อนหวาน',red:'ความสนุก ความรักที่เต็มไปด้วยพลัง',orange:'ความอบอุ่น ความกระตือรือร้น',yellow:'มิตรภาพ ความสุข',white:'ความบริสุทธิ์ จิตใจใสสะอาด'}},
    orchid:{meaning:'ความหรูหรา ความงามที่สง่า ความรักที่ละเอียดอ่อน',colors:{pink:'ความรักอ่อนโยน ความสง่างาม',white:'ความบริสุทธิ์ ความสง่างาม',purple:'ความภาคภูมิใจ ความสูงศักดิ์',yellow:'มิตรภาพ ความสุขสดใส',orange:'ความกล้า ความกระตือรือร้น'}},
    lotus:{meaning:'ความบริสุทธิ์ การตื่นรู้ การเกิดใหม่',colors:{pink:'ความรักและความศรัทธา',white:'ความบริสุทธิ์ทางใจ',blue:'ปัญญา ความสงบ',purple:'ความลึกลับ ความลึกซึ้งทางจิตวิญญาณ',yellow:'ความรู้แจ้ง ความสุข'}},
    sakura:{meaning:'ความงามชั่วคราว การเริ่มต้นใหม่ ความรักที่เพิ่งผลิ',colors:{pink:'ความรักบริสุทธิ์ ความอ่อนโยน',white:'ความบริสุทธิ์ ความหวัง',red:'ความรักที่เข้มข้นขึ้น'},labels:{red:'แดง / ชมพูเข้ม'}},
    chrysanthemum:{meaning:'ความยืนยาว ความจริงใจ การให้เกียรติ',colors:{yellow:'ความเคารพ ความสุข',white:'ความซื่อสัตย์ ความจริงใจ (ในบางวัฒนธรรมใช้ไว้อาลัย)',red:'ความรัก',pink:'ความรักที่ไม่เสื่อมคลาย',purple:'ความคิดถึง ความภักดี'}},
    cosmos:{meaning:'ความสงบ ความเรียบง่าย ความอ่อนโยน',colors:{pink:'ความรักใสซื่อ ความอ่อนโยน',white:'ความบริสุทธิ์ ความเรียบง่าย',red:'ความรักที่สงบแต่มั่นคง',yellow:'ความร่าเริง ความสดใส',orange:'ความร่าเริง ความสดใส'}},
    poppy:{meaning:'การรำลึก การพักผ่อน ความฝัน',colors:{red:'การรำลึก ความรักที่ลึกซึ้ง',orange:'ความสดใส ความมีพลัง',white:'ความสงบ ความหวัง',pink:'ความอ่อนโยน การปลอบโยน',yellow:'ความสุขและความหวัง'}},
    iris:{meaning:'ข่าวดี ความหวัง ปัญญา ความกล้า',colors:{purple:'ปัญญา ความภาคภูมิใจ ความสูงส่ง',blue:'ความหวัง ความเชื่อมั่น',yellow:'ความหลงใหล มิตรภาพ',white:'ความบริสุทธิ์ ความอ่อนโยน',pink:'ความรักอ่อนโยน'}},
    magnolia:{meaning:'ความสง่างาม ความอดทน ความรักในธรรมชาติ',colors:{white:'ความบริสุทธิ์ ความสง่า',pink:'ความรักอ่อนโยน',purple:'ความภาคภูมิใจ ความสูงส่ง',yellow:'ความสดชื่น มิตรภาพ'}},
    gardenia:{meaning:'ความรักที่ละเมียดละไม ความบริสุทธิ์ ความสุขที่เงียบ ๆ',colors:{white:'ความรักบริสุทธิ์ ความสุขที่ซ่อนอยู่',cream:'ความอ่อนโยน ความอบอุ่น',pink:'ความรักที่หวานนุ่ม'}},
    jasmine:{meaning:'ความรักของแม่ ความบริสุทธิ์ ความกตัญญู',colors:{white:'ความรักบริสุทธิ์ ความเคารพ',cream:'ความอ่อนโยน ความละมุน',yellow:'ความสุขและความสง่างาม'}},
    camellia:{meaning:'ความรักที่มั่นคง ความชื่นชม',colors:{red:'ความรักและความหลงใหล',pink:'ความคิดถึง ความอ่อนโยน',white:'ความรอคอย ความบริสุทธิ์',yellow:'ความคิดถึง (บางตำราว่าความโหยหา)'}},
    'orange-blossom':{meaning:'ความบริสุทธิ์ ความสุขในชีวิตคู่ ความอุดมสมบูรณ์',colors:{white:'ความรักบริสุทธิ์ ความหวังดี',orange:'ความอบอุ่น โชคดี ความสุข',cream:'ความอบอุ่น โชคดี ความสุข'}},
    bluebell:{meaning:'ความสุภาพอ่อนโยน ความซื่อสัตย์ ความถ่อมตน',colors:{blue:'ความซื่อสัตย์ ความเชื่อมั่น',purple:'ความอ่อนน้อม ความสงบ',white:'ความบริสุทธิ์ ความอ่อนโยน',pink:'ความรักเรียบง่ายและจริงใจ'}},
    delphinium:{meaning:'ความเปิดใจ ความรักที่เบ่งบาน ความร่าเริง',colors:{blue:'ความเชื่อมั่น ความเปิดกว้าง',purple:'ความภาคภูมิใจ ความเคารพ',pink:'ความรักอ่อนโยน',white:'ความบริสุทธิ์ ความหวังดี'}},
    statice:{meaning:'ความทรงจำที่ไม่เลือนหาย ความจริงใจ ความผูกพันยาวนาน',colors:{purple:'ความทรงจำ ความซื่อสัตย์',blue:'ความสงบ ความจริงใจ',pink:'ความรักอ่อนโยน',white:'ความบริสุทธิ์ ความผูกพันที่คงอยู่',cream:'ความบริสุทธิ์ ความผูกพันที่คงอยู่',yellow:'ความสุข ความอบอุ่นใจ'}},
    lilac:{meaning:'รักแรก ความไร้เดียงสา ความทรงจำวัยเยาว์',colors:{purple:'รักแรก ความหวนคิด',white:'ความบริสุทธิ์ ความไร้เดียงสา',pink:'ความรักอ่อนหวาน',blue:'ความสงบ ความเงียบสงบในใจ'}},
    daffodil:{meaning:'การเริ่มต้นใหม่ ความหวัง การเกิดใหม่',colors:{yellow:'ความหวัง ความสุข การเริ่มต้นใหม่',white:'ความบริสุทธิ์ ความสง่างาม',cream:'ความอ่อนโยน ความหวังที่นุ่มนวล',orange:'ความอบอุ่น ความร่าเริง'}},
    anemone:{meaning:'ความคาดหวัง ความรักที่รอคอย ความอ่อนไหว',colors:{white:'ความจริงใจ ความหวัง',red:'ความรักที่ร้อนแรง ความเสน่หา',purple:'ความทรงจำ ความภักดี',pink:'ความรักอ่อนโยน',blue:'ความสงบ ความเชื่อใจ'}}
  };
  const rgb=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
  function nearest(hex,palette){const a=rgb(hex);return palette.reduce((best,tone)=>{const distance=rgb(tone.swatch).reduce((sum,v,i)=>sum+(v-a[i])**2,0);return !best||distance<best.distance?{tone,distance}:best;},null).tone;}
  function colorMeaning(value){
    const hex=typeof value==='string'&&/^#[\da-f]{6}$/i.test(value)?value.toLowerCase():'#d990a6';
    const exact=tones.find(t=>t.swatch===hex);if(exact)return {...exact,label:'โทน'+exact.name,hex};
    // Historic gifts can contain arbitrary shades; keep their original artwork.
    const [r,g,b]=rgb(hex).map(v=>v/255),max=Math.max(r,g,b),min=Math.min(r,g,b),delta=max-min,l=(max+min)/2;
    const sat=delta===0?0:delta/(1-Math.abs(2*l-1));let hue=0;
    if(delta){hue=max===r?((g-b)/delta)%6:max===g?(b-r)/delta+2:(r-g)/delta+4;hue=(hue*60+360)%360;}
    let id;if(l>.965||(l>.9&&sat<.13))id='white';else if(sat<.12)id=nearest(hex,tones).id;else if(hue>=26&&hue<75&&l>.84)id='cream';else if(hue<16||hue>=330)id=l>.62?'pink':'red';else if(hue<38)id='orange';else if(hue<75)id='yellow';else if(hue<180)id='green';else if(hue<235||(hue<255&&(r<b*.6||sat>.65)))id='blue';else if(hue<325)id='purple';else id='pink';
    const tone=tones.find(t=>t.id===id);return {...tone,label:'โทน'+tone.name,hex};
  }
  function paletteFor(id){const s=species[id];return (s?Object.keys(s.colors).map(id=>tones.find(t=>t.id===id)):tones).map(t=>({...t,name:s?.labels?.[t.id]||t.name,meaning:s?.colors[t.id]||t.meaning}));}
  function forEditor(flowers){return flowers.map(item=>{const palette=paletteFor(item.id),hex=colorMeaning(item.color).hex,tone=palette.find(t=>t.id===colorMeaning(hex).id)||nearest(hex,palette);return {...item,color:tone.swatch};});}
  function describe(item){const flower=window.PixelLove.flowers.find(f=>f.id===item?.id)||window.PixelLove.flowers[0],tone=colorMeaning(item?.color),s=species[flower.id];return {flower,color:{...tone,name:s?.labels?.[tone.id]||tone.name,label:'โทน'+(s?.labels?.[tone.id]||tone.name),meaning:s?.colors[tone.id]||tone.meaning}};}
  // Apply once after the product catalogue so every surface uses the same copy.
  for(const flower of window.PixelLove.flowers){const s=species[flower.id];if(s){flower.meaning=s.meaning;if(s.name)flower.name=s.name;}flower.color=forEditor([{id:flower.id,color:flower.color}])[0].color;}
  for(const product of window.LoveCatalog?.products||[]){if(product.type==='flower'){const f=window.PixelLove.flowers.find(f=>f.id===product.asset);product.note=f.meaning;product.color=f.color;}}
  window.Bouquet={tones,species,paletteFor,forEditor,colorMeaning,describe};
})();
