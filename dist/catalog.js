(() => {
  const products=[
  {
    "id": "flower-peony",
    "type": "flower",
    "asset": "peony",
    "name": "โบตั๋นใจฟู",
    "note": "ความรักที่อุดมสมบูรณ์และคำอวยพร",
    "color": "#df9db4",
    "icon": "✿",
    "amountMinor": 1000,
    "trialAllowed": true
  },
  {
    "id": "flower-lavender",
    "type": "flower",
    "asset": "lavender",
    "name": "ลาเวนเดอร์อุ่นใจ",
    "note": "ความสงบและการรอคอยอย่างอ่อนโยน",
    "color": "#ab9ac8",
    "icon": "❀",
    "amountMinor": 1000,
    "trialAllowed": true
  },
  {
    "id": "bg-starry",
    "type": "background",
    "asset": "starry",
    "name": "คืนดาวของเรา",
    "note": "ฝากคำรักใต้ท้องฟ้าสีม่วง",
    "icon": "✦",
    "amountMinor": 2000,
    "trialAllowed": true
  },
  {
    "id": "bg-cafe",
    "type": "background",
    "asset": "cafe",
    "name": "คาเฟ่วันเดต",
    "note": "มุมเล็ก ๆ ที่อยากนั่งข้างเธอ",
    "icon": "☕",
    "amountMinor": 2000,
    "trialAllowed": true
  },
  {
    "id": "flower-carnation",
    "type": "flower",
    "asset": "carnation",
    "name": "คาร์เนชั่น",
    "note": "ความใส่ใจที่มีให้เธอเสมอ",
    "color": "#e3a0b4",
    "icon": "✿",
    "amountMinor": 1000,
    "trialAllowed": false,
    "collection": "bloom-20"
  },
  {
    "id": "flower-gerbera",
    "type": "flower",
    "asset": "gerbera",
    "name": "เยอบีร่า",
    "note": "รอยยิ้มและวันที่สดใสของเรา",
    "color": "#e9b072",
    "icon": "✿",
    "amountMinor": 1000,
    "trialAllowed": false,
    "collection": "bloom-20"
  },
  {
    "id": "flower-orchid",
    "type": "flower",
    "asset": "orchid",
    "name": "กล้วยไม้",
    "note": "เธอคือความพิเศษที่อยากดูแล",
    "color": "#b89ccf",
    "icon": "✿",
    "amountMinor": 1000,
    "trialAllowed": false,
    "collection": "bloom-20"
  },
  {
    "id": "flower-lotus",
    "type": "flower",
    "asset": "lotus",
    "name": "บัว",
    "note": "ความสงบใจเมื่อได้อยู่ใกล้กัน",
    "color": "#dfa3b6",
    "icon": "✿",
    "amountMinor": 1000,
    "trialAllowed": false,
    "collection": "bloom-20"
  },
  {
    "id": "flower-sakura",
    "type": "flower",
    "asset": "sakura",
    "name": "ซากุระ",
    "note": "เก็บช่วงเวลาดี ๆ ของเราไว้ด้วยกัน",
    "color": "#efbecb",
    "icon": "✿",
    "amountMinor": 1000,
    "trialAllowed": false,
    "collection": "bloom-20"
  },
  {
    "id": "flower-chrysanthemum",
    "type": "flower",
    "asset": "chrysanthemum",
    "name": "เบญจมาศ",
    "note": "รักที่ค่อย ๆ เติบโตอย่างมั่นคง",
    "color": "#e4c77e",
    "icon": "✿",
    "amountMinor": 1000,
    "trialAllowed": false,
    "collection": "bloom-20"
  },
  {
    "id": "flower-cosmos",
    "type": "flower",
    "asset": "cosmos",
    "name": "คอสมอส",
    "note": "ความเรียบง่ายที่ทำให้ใจเป็นสุข",
    "color": "#d99ab5",
    "icon": "✿",
    "amountMinor": 1000,
    "trialAllowed": false,
    "collection": "bloom-20"
  },
  {
    "id": "flower-poppy",
    "type": "flower",
    "asset": "poppy",
    "name": "ป๊อปปี้",
    "note": "ความทรงจำที่อยากเก็บไว้ในหัวใจ",
    "color": "#d6787b",
    "icon": "✿",
    "amountMinor": 1000,
    "trialAllowed": false,
    "collection": "bloom-20"
  },
  {
    "id": "flower-iris",
    "type": "flower",
    "asset": "iris",
    "name": "ไอริส",
    "note": "ความหวังและความเชื่อใจที่มีให้กัน",
    "color": "#a594cb",
    "icon": "✿",
    "amountMinor": 1000,
    "trialAllowed": false,
    "collection": "bloom-20"
  },
  {
    "id": "flower-magnolia",
    "type": "flower",
    "asset": "magnolia",
    "name": "แมกโนเลีย",
    "note": "รักอ่อนโยนที่งดงามในแบบของเรา",
    "color": "#f1ddce",
    "icon": "✿",
    "amountMinor": 1000,
    "trialAllowed": false,
    "collection": "bloom-20"
  },
  {
    "id": "flower-gardenia",
    "type": "flower",
    "asset": "gardenia",
    "name": "พุดซ้อน",
    "note": "ความจริงใจที่ซ่อนอยู่ในทุกความใส่ใจ",
    "color": "#f3ecdb",
    "icon": "✿",
    "amountMinor": 1000,
    "trialAllowed": false,
    "collection": "bloom-20"
  },
  {
    "id": "flower-jasmine",
    "type": "flower",
    "asset": "jasmine",
    "name": "มะลิ",
    "note": "ความปรารถนาดีและรักบริสุทธิ์",
    "color": "#f4eddd",
    "icon": "✿",
    "amountMinor": 1000,
    "trialAllowed": false,
    "collection": "bloom-20"
  },
  {
    "id": "flower-camellia",
    "type": "flower",
    "asset": "camellia",
    "name": "คามีเลีย",
    "note": "ชื่นชมเธอในทุกวันที่เป็นเธอ",
    "color": "#dc9daa",
    "icon": "✿",
    "amountMinor": 1000,
    "trialAllowed": false,
    "collection": "bloom-20"
  },
  {
    "id": "flower-orange-blossom",
    "type": "flower",
    "asset": "orange-blossom",
    "name": "ดอกส้ม",
    "note": "การเริ่มต้นบทใหม่ไปด้วยกัน",
    "color": "#f4e6cf",
    "icon": "✿",
    "amountMinor": 1000,
    "trialAllowed": false,
    "collection": "bloom-20"
  },
  {
    "id": "flower-bluebell",
    "type": "flower",
    "asset": "bluebell",
    "name": "บลูเบลล์",
    "note": "ขอบคุณที่เป็นคนอ่อนโยนกับเรา",
    "color": "#9aaacb",
    "icon": "✿",
    "amountMinor": 1000,
    "trialAllowed": false,
    "collection": "bloom-20"
  },
  {
    "id": "flower-delphinium",
    "type": "flower",
    "asset": "delphinium",
    "name": "เดลฟิเนียม",
    "note": "กำลังใจให้เธอก้าวไปถึงความฝัน",
    "color": "#98b5d3",
    "icon": "✿",
    "amountMinor": 1000,
    "trialAllowed": false,
    "collection": "bloom-20"
  },
  {
    "id": "flower-statice",
    "type": "flower",
    "asset": "statice",
    "name": "สแตติส",
    "note": "ความผูกพันที่อยากเก็บไว้ให้นาน",
    "color": "#b99dcb",
    "icon": "✿",
    "amountMinor": 1000,
    "trialAllowed": false,
    "collection": "bloom-20"
  },
  {
    "id": "flower-lilac",
    "type": "flower",
    "asset": "lilac",
    "name": "ไลแลค",
    "note": "ความรู้สึกดี ๆ ที่ผลิบานในหัวใจ",
    "color": "#bea3cf",
    "icon": "✿",
    "amountMinor": 1000,
    "trialAllowed": false,
    "collection": "bloom-20"
  },
  {
    "id": "flower-daffodil",
    "type": "flower",
    "asset": "daffodil",
    "name": "แดฟโฟดิล",
    "note": "เริ่มต้นวันใหม่ด้วยความหวังและรอยยิ้ม",
    "color": "#edd280",
    "icon": "✿",
    "amountMinor": 1000,
    "trialAllowed": false,
    "collection": "bloom-20"
  },
  {
    "id": "flower-anemone",
    "type": "flower",
    "asset": "anemone",
    "name": "อะเนโมนี",
    "note": "จะอยู่ข้าง ๆ ในวันที่เธอต้องการ",
    "color": "#dba5b8",
    "icon": "✿",
    "amountMinor": 1000,
    "trialAllowed": false,
    "collection": "bloom-20"
  },
  {
    "id": "animal-panda",
    "type": "animal",
    "asset": "panda",
    "name": "หมีแพนด้า",
    "nickname": "เป่าเปา",
    "color": "#f2eee4",
    "note": "กอดนุ่ม ๆ ที่อยากเก็บไว้ให้เธอ",
    "icon": "♡",
    "amountMinor": 3000,
    "trialAllowed": false
  },
  {
    "id": "animal-red-panda",
    "type": "animal",
    "asset": "red-panda",
    "name": "แพนด้าแดง",
    "nickname": "เมเปิล",
    "color": "#c88b68",
    "note": "หางฟู ใจอุ่น พร้อมอยู่ใกล้ ๆ",
    "icon": "♡",
    "amountMinor": 3000,
    "trialAllowed": false
  },
  {
    "id": "animal-monkey",
    "type": "animal",
    "asset": "monkey",
    "name": "ลิง",
    "nickname": "มังกี้",
    "color": "#b99a7d",
    "note": "ชวนยิ้มและซนไปด้วยกัน",
    "icon": "♡",
    "amountMinor": 3000,
    "trialAllowed": false
  },
  {
    "id": "bg-glasshouse",
    "type": "background",
    "asset": "glasshouse",
    "name": "เรือนกระจกดอกไม้",
    "note": "เรือนกระจกแสงอุ่น พร้อมไม้แขวน ชั้นต้นไม้ และมุมจิบน้ำชา",
    "icon": "✿",
    "amountMinor": 4000,
    "trialAllowed": false,
    "collection": "scenes-5"
  },
  {
    "id": "bg-sunset-picnic",
    "type": "background",
    "asset": "sunset-picnic",
    "name": "ปิกนิกริมทะเลยามเย็น",
    "note": "พระอาทิตย์ตก ร่มชายหาด ตะกร้าปิกนิก และคลื่นสีพาสเทล",
    "icon": "☀",
    "amountMinor": 4000,
    "trialAllowed": false,
    "collection": "scenes-5"
  },
  {
    "id": "bg-cozy-room",
    "type": "background",
    "asset": "cozy-room",
    "name": "ห้องอุ่นไอรัก",
    "note": "ห้องอ่านหนังสือพร้อมเตาผิง โซฟา แสงเทียน และหน้าต่างยามเย็น",
    "icon": "♡",
    "amountMinor": 4000,
    "trialAllowed": false,
    "collection": "scenes-5"
  },
  {
    "id": "bg-sakura-lantern",
    "type": "background",
    "asset": "sakura-lantern",
    "name": "สวนซากุระโคมไฟ",
    "note": "กลีบซากุระ โคมไฟ สะพานข้ามลำธาร และโต๊ะชาของเรา",
    "icon": "❀",
    "amountMinor": 4000,
    "trialAllowed": false,
    "collection": "scenes-5"
  },
  {
    "id": "bg-starlight-rooftop",
    "type": "background",
    "asset": "starlight-rooftop",
    "name": "ดาดฟ้านับดาว",
    "note": "กล้องดูดาว แสงเมือง ไฟประดับ และมุมนั่งดูจันทร์ด้วยกัน",
    "icon": "✦",
    "amountMinor": 4000,
    "trialAllowed": false,
    "collection": "scenes-5"
  }
];
  for(const p of products){
    if(p.type==='flower')window.PixelLove.flowers.push({id:p.asset,name:p.name,meaning:p.note,color:p.color});
    else if(p.type==='animal')window.PixelLove.animals.push({id:p.asset,name:p.name,nickname:p.nickname,note:p.note,color:p.color});
    else window.PixelLove.backgrounds.push({id:p.asset,name:p.name});
  }
  const productFor=(type,asset)=>products.find(p=>p.type===type&&p.asset===asset);
  const specialLabels=gift=>[...(productFor('animal',gift.animal)?['Special doll']:[]),...(gift.flowers.some(f=>productFor('flower',f.id))?['Special flower']:[])];
  window.LoveCatalog={products,productFor,specialLabels};
})();
