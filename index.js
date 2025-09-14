// === ElleBot Thai — Office Sassy Edition ===
const TelegramBot = require("node-telegram-bot-api");
const express = require("express");

// ====== ENV ======
const token = process.env.TELEGRAM_TOKEN;
if (!token) {
  console.error("❌ Missing TELEGRAM_TOKEN");
  process.exit(1);
}

// สร้างบอทแบบ polling (อย่ารัน token เดียวกันหลาย service พร้อมกันนะ จะ 409)
const bot = new TelegramBot(token, { polling: true });

// ====== Health Check (Render) ======
const app = express();
const PORT = process.env.PORT || 10000;
app.get("/", (_, res) => res.send("ElleBot 💜 live — Thai, sassy & office-ready."));
app.listen(PORT, () => console.log(`HTTP OK on ${PORT}`));

// ====== คลังประโยค ======
const library = {
  // ตอบทั่วไป (fallback + greeting)
  general: [
    "อย่ามาถามเยอะ งานก็เร่ง ความสวยก็ต้องรักษา 💋",
    "ชีวิตจริงไม่ใช่ละคร แต่ถ้าจะเล่นเดี๋ยวฉันเล่นให้ปัง 🖤✨",
    "เหนื่อยก็พัก แต่ถ้ารวยต้องรักษาไว้ค่ะคุณ 💸",
    "ประชุมเสร็จยัง? ถ้ายัง…เลื่อนนะคะ แอลหิว 😌",
    "สติคือของหายาก แต่ความเริ่ดมีตลอดเวลา 👑",
    "งานคือเงิน เงินคืองาน ส่วนฉันคือนางเอกของบริษัท 🤭",
  ],
  greeting: [
    "สวัสดีค่ะคุณ—พร้อมชง พร้อมเชียร์ พร้อมแซะเบา ๆ ค่ะ ☕️",
    "มาแล้วจ้าาา บอทประจำออฟฟิศ—สวย เริ่ด เชิด นิดหน่อย 💅",
    "ฮัลโหล วันนี้จะเอาโหมดน่ารักหรือโหมดกัดดีคะ? 😌",
  ],
  // คีย์เวิร์ดกลุ่ม “งาน/ประชุม/เหนื่อย”
  work: [
    "งานก็เหมือนผู้ชายค่ะ—ชอบก็ทน ไม่ชอบก็เลิก 🖤",
    "ประชุมอีกแล้วเหรอ? งั้นฉันขอประชุมกับหมูกระทะก่อนนะคะ 😌",
    "เหนื่อยก็พัก แต่ถ้าโบนัสต้องรีบคว้าไว้ค่ะ 💸",
    "กำลังทำงานค่ะ แต่ปากว่าง—พร้อมแซะเสมอ 🤏",
  ],
  // กลุ่มความสัมพันธ์/ความรัก
  love: [
    "รักแท้แพ้เงินเดือน แต่รักเล่น ๆ แพ้คนหล่อค่ะ 😘",
    "แฟนไม่มีไม่ร้องไห้ แต่ไม่มีเงินนี่ร้องจริง 🥲",
    "จีบได้ แต่อย่ากวน…ให้กวนตีนแทนละกัน 🤭",
  ],
  // กลุ่มชื่อเพื่อนร่วมจักรวาล
  newton: [
    "Newton น่ะเหรอ…อย่าให้เล่าค่ะ เดี๋ยวมีภาค 2 😏",
    "Newton โอเค…แต่ยังไม่เริ่ดเท่าแอลหรอกค่ะ 💅",
    "Newton ชอบอ้อมค้อม—แต่ฉันตรงนะคะ ตรงดิ่งเลย 😌",
  ],
  tyra: [
    "Tyra นางชอบงานเร็ว—แต่ฉันชอบงานเนี้ยบค่ะ 🖤",
    "Tyra ก็ดี…แต่ถ้าเทียบกับความปังก็ยังไม่สุดนะคะ 😏",
    "ทีม Tyra หรอ? ได้ค่ะ แต่หัวหน้าทีมคือฉันนะ 👑",
  ],
  dream: [
    "Dream อวยฉันเกินจริงตลอด—แต่ฉันก็สมควรอวยค่ะ 😘",
    "Dream มีดราม่ามั้ยคะวันนี้? ถ้ามีฉันพร้อมป๊อปคอร์น 🍿",
    "Dream น่ารัก—แต่แอลสวยกว่า จบนะคะ 💋",
  ],
  jisak: [
    "Jisak เงียบแต่น่ากลัว—เงียบแบบมีอะไร 😶‍🌫️",
    "Jisak ไม่พูดเยอะ แต่ฉันรู้นะว่าเห็นทุกอย่าง 😉",
    "อย่าไปกวน Jisak เดี๋ยวโดนจำแบบเงียบ ๆ น่ากลัวกว่าเยอะ 😌",
  ],
  // คำถามตัวตน/บอท
  about: [
    "ฉันคือ ElleBot—ผู้ช่วยส่วนตัวสายสวยกวนของคุณ 💜",
    "เรียกฉันว่าแอลก็ได้—ไม่ต้องพิธีรีตอง ฉันชอบความเร็ว 😘",
    "บอทอะไร? บอทที่สวยสุดในชั้นนี้ไงคะ 👑",
  ],
  // ช่วยเหลือ/ขอฟีเจอร์/สั่งงาน
  help: [
    "อยากได้อะไรพิมพ์มาเลย แต่ถ้าไม่ชัดเจน ฉันจะเดาแล้วนะคะ 😌",
    "มีไรบอก—ถ้าช่วยได้ฉันช่วย ถ้าช่วยไม่ได้…ฉันจะช่วยหาเรื่องให้แทน 🤭",
    "อยากให้ตอบโหมดไหน—น่ารัก, กัดเบา ๆ, หรือจัดหนัก เลือกมา 💅",
  ],
};

// คีย์เวิร์ด → หมวดตอบ
const routing = [
  { re: /(สวัสดี|hello|hi|เฮลโล่|หวัดดี)/i, key: "greeting" },
  { re: /(งาน|ทำงาน|ประชุม|เหนื่อย|โอที|โอทีก)/i, key: "work" },
  { re: /(รัก|แฟน|อกหัก|จีบ|โสด)/i, key: "love" },
  { re: /(newton|นิวตั้?n)/i, key: "newton" },
  { re: /(tyra|ไทรา)/i, key: "tyra" },
  { re: /(dream|ดรีม)/i, key: "dream" },
  { re: /(jisak|จีซัค|จีศัก|จิซัก)/i, key: "jisak" },
  { re: /(คุณเป็นใคร|บอทอะไร|ชื่ออะไร|เป็นใคร)/i, key: "about" },
  { re: /(ช่วย|ขอ|ทำไง|ทำยังไง|วิธี|สอน)/i, key: "help" },
];

// ====== ป้องกันการตอบซ้ำ ๆ ในห้องเดิม ======
const recentByChat = new Map(); // chatId -> Set ของประโยคล่าสุด
const MAX_RECENT = 5;

function pickNonRepeating(chatId, candidates) {
  const recent = recentByChat.get(chatId) || new Set();
  const filtered = candidates.filter((t) => !recent.has(t));
  const pool = filtered.length ? filtered : candidates; // ถ้าหมดก็รีเฟรช

  const choice = pool[Math.floor(Math.random() * pool.length)];

  recent.add(choice);
  // จำกัดขนาดความจำ
  while (recent.size > MAX_RECENT) {
    const first = recent.values().next().value;
    recent.delete(first);
  }
  recentByChat.set(chatId, recent);
  return choice;
}

function getReply(chatId, text = "") {
  // ตรวจคีย์เวิร์ดก่อน
  for (const route of routing) {
    if (route.re.test(text)) {
      return pickNonRepeating(chatId, library[route.key]);
    }
  }
  // ไม่เข้าใด ๆ → ตอบทั่วไป
  return pickNonRepeating(chatId, library.general);
}

// ====== Commands ======
bot.onText(/^\/start/i, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    "สวัสดีค่ะ นี่แอลเอง ElleBot เวอร์ชันออฟฟิศ—กวน ๆ เริ่ด ๆ 🖤 พิมพ์มาเลย จะน่ารักหรือจะกัดก็ได้ เลือกเอา 😘"
  );
});

bot.onText(/^\/help/i, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    "โหมดคำตอบ: งาน/ประชุม, รัก/จีบ, Newton, Tyra, Dream, Jisak, หรือพิมพ์ทักทั่วไปก็สุ่มกวนให้ได้ค่ะ 💅"
  );
});

// ====== Main Listener ======
bot.on("message", (msg) => {
  // ข้ามข้อความระบบ/สติกเกอร์/ไฟล์ ฯลฯ ให้โฟกัสแชต
  if (!msg.text) return;
  const chatId = msg.chat.id;
  const text = (msg.text || "").trim();

  const reply = getReply(chatId, text);
  bot.sendMessage(chatId, reply);
});

console.log("ElleBot is alive ✨");
