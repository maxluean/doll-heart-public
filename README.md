# Special Doll · ความในใจภายในตุ๊กตา

เว็บสร้างของขวัญพิกเซลสำหรับคนพิเศษ: แต่งตัวตุ๊กตา วาดชุด จัดช่อดอกไม้ตามความหมาย เขียนจดหมาย แนบเพลง และส่งลิงก์ให้คนรับเปิดซอง อ่านจดหมาย แล้วแกะกล่องของขวัญ

**Live website:** [specialdoll.pages.dev](https://specialdoll.pages.dev)
**Public source for YWC21 interview review:** ซอร์สเวอร์ชันล่าสุดที่แยกออกจาก repository สำหรับใช้งานจริง ไม่มีประวัติเดิม คีย์ บัญชี ข้อมูลลูกค้า หรือข้อมูลธุรกรรมจริง

## ทดลองในเครื่องโดยไม่ใช้บัญชีหรือคีย์

ต้องมี Node.js 22

```sh
npm ci
npm run dev:demo
```

เปิด **http://127.0.0.1:4174** แล้วกดเริ่มทำของขวัญ Demo ใช้ฐานข้อมูลและ Stripe จำลองภายใน process ข้อมูลหายเมื่อหยุดเซิร์ฟเวอร์ ไม่มีการรับเงินจริง ลิงก์ที่สร้างใน demo ใช้ได้เฉพาะระหว่างที่เซิร์ฟเวอร์นั้นทำงานอยู่

เพลงพื้นหลังต้นฉบับไม่ได้แนบมาใน public source และปิดไว้ใน demo ดู [รายละเอียดไฟล์เสียง](dist/audio/README.md) ภาพคู่มือใช้ข้อมูลสมมติ ส่วน contact email ในหน้าข้อมูลเป็น placeholder เท่านั้น

## สิ่งที่ลองได้

- เลือกสัตว์พิกเซล แต่งชุด เปลี่ยนสี และวาดเสื้อ หมวก หรือแว่นเอง
- จัดช่อ เลือกสีดอกไม้ กระดาษห่อและริบบิ้น พร้อมความหมายของดอกไม้และสี
- เขียนจดหมายและแนบลิงก์เพลง ดูตัวอย่างผู้รับและการเปิดซอง/กล่อง
- สร้างลิงก์และลิงก์จัดการด้วยข้อมูลจำลอง
- สร้างภาพสตอรี่ 1080 × 1920 เลือกซ่อนข้อความและชื่อแยกกัน
- ดูร้านและยอดต่อของขวัญ โดยทดสอบการชำระผ่าน test doubles ไม่ใช่หน้า QR จริง

## Tech stack

| ส่วน | เทคโนโลยี |
| --- | --- |
| Frontend | HTML, CSS, JavaScript, Canvas 2D, Web Audio element |
| Hosting / API | Cloudflare Pages Advanced mode / Pages Functions |
| Database | Supabase PostgreSQL, SQL functions, RLS |
| Payments | Stripe Hosted Checkout, PromptPay, signed webhooks |
| Tests | Node.js test runner, browser/DOM test doubles, Miniflare runtime |

โปรเจกต์ใช้ JavaScript โดยตรง ไม่มี React หรือ frontend framework

## โครงสร้าง

- `dist/` หน้าเว็บ renderer ภาพพิกเซล custom wardrobe และคู่มือ
- `lib/` validation, guest gifts, ลิงก์จัดการ และการตรวจผลชำระ
- `cloudflare/worker.mjs` adapter สำหรับ Pages และ `api/handler.js` adapter Vercel เดิม
- `supabase/migrations/` schema/RLS/RPC เท่านั้น ไม่มี database dump
- `tests/` unit และ integration tests ที่ใช้ข้อมูลสมมติ
- `scripts/` build, local demo, runtime verification และตรวจไฟล์ก่อนเผยแพร่

## ตรวจงาน

```sh
npm test
npm run build:pages
npm run test:pages
npm run audit:public
```

## การทำงานโดยย่อ

ผู้ส่งจัดของขวัญ → server ตรวจ payload และคำนวณราคาจาก catalog → ของพื้นฐานสร้างลิงก์ฟรี 1 ชั่วโมง / รายการมีค่าใช้จ่ายรอผลชำระ → webhook ที่ตรวจลายเซ็นแล้วเปิดลิงก์ 30 วัน → คนรับเปิดผ่าน share token

ดอกไม้พิเศษ 10 บาท/ชนิด ตุ๊กตาพิเศษ 30 บาท/ตัว ฉาก 20 หรือ 40 บาท/ฉาก เป็นราคาต่อของขวัญ ของพิเศษรวมลิงก์ 30 วันแล้ว ส่วนของพื้นฐานทั้งหมดเลือกเพิ่มอายุ 30 วันได้ 19 บาท ราคาและอายุจริงตรวจฝั่ง server และ SQL ไม่เชื่อยอดจาก browser

ดู [สถาปัตยกรรมและจุดที่ใช้เล่าในการสัมภาษณ์](docs/ARCHITECTURE.md) และ [ขอบเขตข้อมูลที่เผยแพร่](docs/PUBLIC_SOURCE.md)

## ใช้ฐานข้อมูลหรือ deploy ของตัวเอง

คัดลอก `.env.example` เป็น `.env.local` เฉพาะในเครื่อง และใส่ค่าของโปรเจกต์ตัวเอง รัน migrations บนฐานข้อมูลแยกที่เป็นของตัวเอง ตั้งค่า origin และ secrets ของตัวเองใน provider dashboard

`wrangler.jsonc` ใช้ placeholder, Stripe test mode และปิด Live payments เป็นค่าเริ่มต้น อย่า deploy โดยเชื่อม production ของบุคคลอื่น และอย่าใส่ service key/Stripe key ใน `dist/` หรือ Git

Cloudflare Pages: build command `npm run build:pages`, output `.pages`, Node.js 22 รายละเอียด environment อยู่ใน `.env.example` การเปิดรับเงินจริงต้องตั้งค่าบัญชีและ webhook ของผู้ deploy เอง

## การใช้ AI ในโปรเจกต์

โปรเจกต์นี้พัฒนาโดยใช้ AI coding agent ช่วยเขียนและปรับโค้ด ผู้สร้างเป็นผู้กำหนดไอเดีย ประสบการณ์ผู้ใช้ ภาพและฟีเจอร์ เลือกแนวทาง ทดลองใช้งาน และให้ feedback เพื่อแก้ปัญหาที่พบ ซอร์สนี้เปิดเพื่อให้ตรวจการทำงานและอธิบายการตัดสินใจได้ตามจริง

## ทรัพยากรภายนอก

ฟอนต์ Mali และ Itim มีไฟล์ OFL แนบใน `dist/fonts/` ไฟล์เพลง production ไม่รวมอยู่ใน repository นี้ การเปิด source ให้ดูสาธารณะไม่ได้เปลี่ยนเงื่อนไขสิทธิ์ของทรัพยากรภายนอก
