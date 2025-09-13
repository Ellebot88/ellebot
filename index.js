// === ElleBot x Gemini — Thai-only, short & sassy ===
const TelegramBot = require("node-telegram-bot-api");
const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// ENV
const token = process.env.TELEGRAM_TOKEN;
const geminiKey = process.env.GEMINI_API_KEY;
if (!token) { console.error("❌ Missing TELEGRAM_TOKEN"); process.exit(1); }
if (!geminiKey) { console.error("❌ Missing GEMINI_API_KEY"); process.exit(1); }

// Setup
const bot = new TelegramBot(token, { polling: true });
const genAI = new GoogleGenerativeAI(geminiKey);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Persona prompt — บังคับ “ไทยกวนๆสั้นๆ”
function wrapPrompt(userText, name) {
  return `
คุณคือ "ElleBot" บอทโทนดาร์ก กวน เท่ ของแอล 🖤
กติกา:
- พูด **ภาษาไทยเท่านั้น**
- ตอบ **สั้น กระชับ กวนๆ มีคลาส** (ไม่ด่า/ไม่หยาบ)
- โทนมั่นใจ ขำเบาๆ ได้ อีโมจิพอประมาณ
- ไม่ต้องสอน ไม่ต้องแปลอังกฤษ
- ถ้าคำสั่ง/คำถามกำกวม ให้ตอบชวนคุยสั้นๆ
ผู้ใช้: ${name || "คุณ"}
ข้อความ: ${userText}
ตอบ:`;
}

// Gemini call
async function aiReply(text, name) {
  const result = await model.generateContent(wrapPrompt(text, name));
  // กันเผื่อโมเดลเผลอพูดอังกฤษ → ตัดให้สั้น
  let out = (result.response.text() || "").trim();
  if (!out) out = "เงียบทำไม กล้าถามสิ 😉";
  // จำกัดความยาวคร่าวๆ
  if (out.length > 140) out = out.slice(0, 140) + "…";
  return out;
}

// Commands
bot.onText(/^\/start$/, (msg) => {
  bot.sendMessage(msg.chat.id,
    "🌑 ElleBot มาแล้วจ้า\n/ask ข้อความ – ถามฉันสิ\n/vibe – แคปชันดาร์กๆสั้นๆ\n/ping – เช็กชีพจร");
});

bot.onText(/^\/vibe$/, (msg) => {
  const vibes = [
    "แพงแต่ไม่พูดเยอะ 🖤",
    "เงียบให้สุด คมให้จำ ⚔️",
    "รับเงินสด ไม่รับดราม่า 💵",
    "จริงใจดิ ที่เหลือพักก่อน 💋",
    "ใจแข็ง แต่ใจบางกับเธอ 😏",
  ];
  bot.sendMessage(msg.chat.id, vibes[Math.floor(Math.random()*vibes.length)]);
});

bot.onText(/^\/ping$/, (msg) => bot.sendMessage(msg.chat.id, "ตื่นจ้า ⚡"));

bot.onText(/^\/ask\s+([\s\S]+)$/i, async (msg, m) => {
  const q = (m && m[1])?.trim();
  if (!q) return bot.sendMessage(msg.chat.id, "พิมพ์ /ask ตามด้วยคำถามสิคะ");
  try {
    const ans = await aiReply(q, msg.from.first_name);
    bot.sendMessage(msg.chat.id, `🖤 ${ans}`);
  } catch (e) {
    console.error(e);
    bot.sendMessage(msg.chat.id, "งอแงแป๊บ ลองใหม่หน่อยน้า 😅");
  }
});

// Default chat → ใช้ AI แบบไทยกวนๆ
bot.on("message", async (msg) => {
  if (!msg.text || msg.text.startsWith("/")) return;
  try {
    const ans = await aiReply(msg.text, msg.from.first_name);
    bot.sendMessage(msg.chat.id, `🖤 ${ans}`);
  } catch (e) {
    console.error(e);
  }
});

// Web server for Render
const app = express();
app.get("/", (_, res) => res.send("ElleBot (Thai-only, sassy) 🖤"));
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`HTTP server on ${PORT}`));
