// === ElleBot x Gemini — Thai / Isan, short & sassy + quota-safe ===
const TelegramBot = require("node-telegram-bot-api");
const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// ===== ENV =====
const token = process.env.TELEGRAM_TOKEN;
const geminiKey = process.env.GEMINI_API_KEY;
if (!token) { console.error("❌ Missing TELEGRAM_TOKEN"); process.exit(1); }
if (!geminiKey) { console.error("❌ Missing GEMINI_API_KEY"); process.exit(1); }

// ===== Web server for Render health =====
const app = express();
const PORT = process.env.PORT || 10000;
app.get("/", (_, res) => res.send("ElleBot is live 🖤"));
app.listen(PORT, () => console.log(`HTTP server on ${PORT}`));

// ===== Telegram + Gemini =====
const bot = new TelegramBot(token, { polling: true });
const genAI = new GoogleGenerativeAI(geminiKey);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// ===== Mode switch =====
let modeIsan = true; // เริ่มต้นโหมดอีสาน

// ===== Rate-limit & Retry (กันโควต้า) =====
const RATE_LIMIT_MS = 1500; // เว้นอย่างน้อย 1.5s ต่อคำขอ
let lastCallAt = 0;
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
async function withRateLimit() {
  const now = Date.now();
  const wait = Math.max(0, RATE_LIMIT_MS - (now - lastCallAt));
  if (wait > 0) await sleep(wait);
  lastCallAt = Date.now();
}

// ===== Persona prompt =====
function buildPrompt(userText, name) {
  const personaCommon = `
คุณคือ "ElleBot" โทนดาร์ก กวน ตลก มีคลาส 🖤
กติกา:
- ห้ามเหยียด/คุกคาม/คำหยาบแรง
- แซวได้ ดาร์กได้ แต่สุภาพพอประมาณ
- ตอบสั้น กระชับ ใส่อีโมจิพอประมาณ
- ห้ามสลับไปอธิบายภาษาอังกฤษ
`;

  const personaIsan = `
- ใช้ภาษาอีสานเป็นหลัก เช่น "เด้อ", "จั่งได๋", "คักแท้"
- โทนกวน ๆ ขำ ๆ แบบคนแพง มีจริตนิด ๆ
- ถ้าคำถามจริงจัง ให้ตอบพอสั้น ๆ แล้วหยอดมุกอีสานท้ายประโยค
`;

  const personaThai = `
- ใช้ภาษาไทยกลางสั้น ๆ โทนกวน ๆ เท่ ๆ
`;

  const persona = modeIsan ? personaCommon + personaIsan : personaCommon + personaThai;

  return `
${persona}
ผู้ใช้: ${name || "เพิ่น"}
ข้อความ: ${userText}
ตอบสั้น ๆ เลย:`;
}

// ===== Gemini call with retry/backoff when 429 =====
async function aiReply(text, name) {
  const fallback = [
    "คิวแน่นแหน่เด้อ รอแป๊บเดียวเด้อ 🖤",
    "ใจเย็นเด้อ กำลังเคลียร์คิวให้อยู่ 😌",
    "พักก่อนจักหน่อย เดี๋ยวจัดให้คัก ๆ เด้อ 😉"
  ];

  const MAX_RETRIES = 3;
  let delay = 10_000; // 10s → 20s → 40s

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await withRateLimit();
      const result = await model.generateContent(buildPrompt(text, name));
      let out = (result.response.text() || "").trim();
      if (!out) out = "เงียบเฮ็ดหยังล่ะ กล้าถามโลด 😉";
      if (out.length > 140) out = out.slice(0, 140) + "…";
      if (/[a-zA-Z]{3,}/.test(out)) out = modeIsan ? "เว้าภาษาอีสานเด้อ บ่แปลอังกฤษเด้อ 😌" : "ขอไทยล้วน ไม่แปลอังกฤษนะ 😌";
      return out;
    } catch (err) {
      const msg = String(err?.message || err);
      const is429 = msg.includes("429")
        || msg.toLowerCase().includes("quota")
        || msg.toLowerCase().includes("too many requests");
      if (is429 && attempt < MAX_RETRIES) {
        console.warn(`429 quota, retry in ${Math.round(delay/1000)}s…`);
        await sleep(delay);
        delay *= 2;
        continue;
      }
      console.error("Gemini error:", err);
      return fallback[Math.floor(Math.random() * fallback.length)];
    }
  }
}

// ===== Commands =====
bot.onText(/^\/start$/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    "🌑 ElleBot พร้อมจิกกัดแล้วเด้อ\n/ask ข้อความ – ถามมาโลด\n/vibe – แคปชันดาร์กๆ\n/isan on|off – สลับโหมดอีสาน\n/ping – เช็กชีพจร"
  );
});

bot.onText(/^\/vibe$/, (msg) => {
  const vibes = modeIsan
    ? [
        "แพงแต่บ่เว้า หล่อบ่ต้องประกาศ 🖤",
        "เงียบให้สุด คมให้จำ เด้อ ⚔️",
        "บ่รับดราม่า รับแต่เงินสดเด้อ 💵",
        "จริงใจบ่ มีบ่ ที่เหลือพักก่อนเด้อ 💋",
        "ใจแข็ง แต่ใจบางกับเจ้า 😏",
      ]
    : [
        "แพงแต่ไม่พูดเยอะ 🖤",
        "เงียบให้สุด คมให้จำ ⚔️",
        "ไม่รับดราม่า รับแต่เงินสด 💵",
        "จริงใจก่อน ที่เหลือพักก่อน 💋",
        "ใจแข็ง แต่ใจบางกับเธอ 😏",
      ];
  bot.sendMessage(msg.chat.id, vibes[Math.floor(Math.random() * vibes.length)]);
});

bot.onText(/^\/ping$/, (msg) => bot.sendMessage(msg.chat.id, "ตื่นจ้า ⚡"));

bot.onText(/^\/isan\s+(on|off)$/i, (msg, m) => {
  modeIsan = (m[1].toLowerCase() === "on");
  bot.sendMessage(msg.chat.id, modeIsan ? "เปิดโหมดอีสานแล้วเด้อ 🤟" : "ปิดโหมดอีสาน กลับไทยกลางแล้วจ้า");
});

bot.onText(/^\/ask\s+([\s\S]+)$/i, async (msg, m) => {
  const q = (m && m[1])?.trim();
  if (!q) return bot.sendMessage(msg.chat.id, modeIsan ? "พิมพ์ /ask ตามด้วยคำถามโลดเด้อ" : "พิมพ์ /ask แล้วตามด้วยคำถามนะ");
  const ans = await aiReply(q, msg.from.first_name);
  bot.sendMessage(msg.chat.id, `🖤 ${ans}`);
});

// ข้อความทั่วไป
bot.on("message", async (msg) => {
  if (!msg.text || msg.text.startsWith("/")) return;
  const ans = await aiReply(msg.text, msg.from.first_name);
  bot.sendMessage(msg.chat.id, `🖤 ${ans}`);
});


