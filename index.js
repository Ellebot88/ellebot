// === ElleBot x Gemini — Thai-only, short & sassy + Quota-safe ===
const TelegramBot = require("node-telegram-bot-api");
const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// ENV
const token = process.env.TELEGRAM_TOKEN;
const geminiKey = process.env.GEMINI_API_KEY;
if (!token) { console.error("❌ Missing TELEGRAM_TOKEN"); process.exit(1); }
if (!geminiKey) { console.error("❌ Missing GEMINI_API_KEY"); process.exit(1); }

// Setup HTTP (Render health)
const app = express();
const PORT = process.env.PORT || 10000;
app.get("/", (_, res) => res.send("ElleBot (Thai-only, sassy) 🖤"));
app.listen(PORT, () => console.log(`HTTP server on ${PORT}`));

// Telegram + Gemini
const bot = new TelegramBot(token, { polling: true });
const genAI = new GoogleGenerativeAI(geminiKey);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// ===== Rate limit & retry settings =====
const RATE_LIMIT_MS = 1500;       // เว้นอย่างน้อย 1.5 วิ/คำขอ
let lastCallAt = 0;

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function withRateLimit() {
  const now = Date.now();
  const wait = Math.max(0, RATE_LIMIT_MS - (now - lastCallAt));
  if (wait > 0) await sleep(wait);
  lastCallAt = Date.now();
}

// สร้าง prompt บังคับ “ไทยสั้นกวน”
function buildPrompt(userText, name) {
  return `
คุณคือ "ElleBot" บอทโทนดาร์ก กวน เท่ ของแอล 🖤
กติกา:
- พูดภาษาไทยเท่านั้น
- ตอบสั้น กระชับ กวนๆ แต่สุภาพพอประมาณ
- โทนมั่นใจ มีอีโมจินิดหน่อย
- ห้ามสลับไปอธิบายยาวหรือภาษาอังกฤษ
ผู้ใช้: ${name || "คุณ"}
ข้อความ: ${userText}
ตอบสั้นๆ:`;
}

// เรียก Gemini พร้อมรีทราย/backoff เมื่อเจอ 429
async function aiReply(text, name) {
  const fallback = [
    "พักก่อน โควต้าแน่นนิดนึง 😵‍💫",
    "รอฉันหายฮอตแป๊บเดียว เดี๋ยวจัดให้ 😉",
    "คิวแน่นมาก ตอนนี้ตอบสั้นๆไปก่อนนะ 🖤",
  ];

  const MAX_RETRIES = 3;
  let delay = 10_000; // เริ่มรอ 10 วินาที

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await withRateLimit();
      const result = await model.generateContent(buildPrompt(text, name));
      let out = (result.response.text() || "").trim();

      if (!out) out = "เงียบทำไม กล้าถามสิ 😉";
      if (out.length > 140) out = out.slice(0, 140) + "…";
      // กันหลุดเป็นอังกฤษ
      if (/[a-zA-Z]{3,}/.test(out)) out = "ไทยเท่านั้นจ้า ไม่แปลให้ด้วย 😌";
      return out;
    } catch (err) {
      const msg = String(err?.message || err);
      const is429 =
        msg.includes("429") ||
        msg.toLowerCase().includes("quota") ||
        msg.toLowerCase().includes("too many requests");

      if (is429 && attempt < MAX_RETRIES) {
        console.warn(`429 quota, retrying in ${Math.round(delay/1000)}s…`);
        await sleep(delay);
        delay *= 2; // backoff: 10s → 20s → 40s
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
    "🌑 ElleBot พร้อมจิกกัดแบบไทยล้วน\n/ask ข้อความ – ถามมาเดี๋ยวตอบ\n/vibe – แคปชันดาร์กๆ\n/ping – เช็กชีพจร"
  );
});

bot.onText(/^\/vibe$/, (msg) => {
  const vibes = [
    "แพงแต่ไม่พูดเยอะ 🖤",
    "เงียบให้สุด คมให้จำ ⚔️",
    "รับเงินสด ไม่รับดราม่า 💵",
    "จริงใจดิ ที่เหลือพักก่อน 💋",
    "ใจแข็ง แต่ใจบางกับเธอ 😏",
  ];
  bot.sendMessage(msg.chat.id, vibes[Math.floor(Math.random() * vibes.length)]);
});

bot.onText(/^\/ping$/, (msg) => bot.sendMessage(msg.chat.id, "ตื่นจ้า ⚡"));

bot.onText(/^\/ask\s+([\s\S]+)$/i, async (msg, m) => {
  const q = (m && m[1])?.trim();
  if (!q) return bot.sendMessage(msg.chat.id, "พิมพ์ /ask ตามด้วยคำถามสิคะ");
  const ans = await aiReply(q, msg.from.first_name);
  bot.sendMessage(msg.chat.id, `🖤 ${ans}`);
});

// ข้อความทั่วไป → ใช้ AI ไทยกวนๆ
bot.on("message", async (msg) => {
  if (!msg.text || msg.text.startsWith("/")) return;
  const ans = await aiReply(msg.text, msg.from.first_name);
  bot.sendMessage(msg.chat.id, `🖤 ${ans}`);
});

