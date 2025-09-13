// === ElleBot + Gemini ===
const TelegramBot = require("node-telegram-bot-api");
const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Env
const token = process.env.TELEGRAM_TOKEN;
const geminiKey = process.env.GEMINI_API_KEY;

if (!token) {
  console.error("❌ Missing TELEGRAM_TOKEN");
  process.exit(1);
}
if (!geminiKey) {
  console.error("⚠️ Missing GEMINI_API_KEY (บอทจะตอบไม่ได้)");
}

const bot = new TelegramBot(token, { polling: true });
const genAI = geminiKey ? new GoogleGenerativeAI(geminiKey) : null;
const model = genAI ? genAI.getGenerativeModel({ model: "gemini-1.5-flash" }) : null;

// ฟังก์ชันเรียก Gemini
async function aiReply(text) {
  if (!model) return "ยังไม่ได้ใส่ GEMINI_API_KEY ค่ะ";
  try {
    const result = await model.generateContent(text);
    return result.response.text();
  } catch (err) {
    console.error("Gemini error:", err);
    return "AI งอแงอยู่ค่ะ 😅";
  }
}

// ── Commands ──
bot.onText(/^\/start$/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    `⚡️ ElleBot พร้อมคุยแล้ว!\n\n/ask <ข้อความ> – ให้ Gemini ตอบ\n/vibe – ส่งแคปชันดาร์กๆ\n/ping – เช็กว่าบอทยังตื่นอยู่`
  );
});

bot.onText(/^\/ask (.+)/, async (msg, match) => {
  const q = match[1];
  const reply = await aiReply(q);
  bot.sendMessage(msg.chat.id, reply);
});

bot.onText(/^\/vibe$/, (msg) => {
  const vibes = [
    "ใจเย็นแต่ไม่เย่อหยิ่ง แพงแต่ไม่พูดเยอะ 🖤",
    "วันนี้ไม่รับพลังลบ รับแต่เงินสด 💵",
    "ชอบคนจริงใจ ที่เหลือพักก่อนค่ะ 💋"
  ];
  bot.sendMessage(msg.chat.id, vibes[Math.floor(Math.random() * vibes.length)]);
});

bot.onText(/^\/ping$/, (msg) => bot.sendMessage(msg.chat.id, "pong 🦋"));

// ── ตอบข้อความทั่วไป ──
bot.on("message", async (msg) => {
  if (!msg.text || msg.text.startsWith("/")) return;
  const reply = await aiReply(msg.text);
  bot.sendMessage(msg.chat.id, reply);
});

// ── Web server for Render ──
const app = express();
app.get("/", (req, res) => res.send("ElleBot (Gemini) is running 🖤"));
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`HTTP server running on ${PORT}`));

