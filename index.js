// === ElleBot x Gemini ===
// โหมดดาร์กๆ กวนๆ แบบ Elle 🖤

const TelegramBot = require("node-telegram-bot-api");
const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// ===== Env =====
const token = process.env.TELEGRAM_TOKEN;
const geminiKey = process.env.GEMINI_API_KEY;

if (!token) {
  console.error("❌ Missing TELEGRAM_TOKEN");
  process.exit(1);
}
if (!geminiKey) {
  console.error("❌ Missing GEMINI_API_KEY");
  process.exit(1);
}

// ===== Setup =====
const bot = new TelegramBot(token, { polling: true });
const genAI = new GoogleGenerativeAI(geminiKey);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const app = express();
const PORT = process.env.PORT || 10000;

app.get("/", (req, res) => {
  res.send("ElleBot is alive 🖤");
});

app.listen(PORT, () => {
  console.log(`⚡ Server running on port ${PORT}`);
});

// ===== Telegram Bot =====
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    "🌑 ElleBot โหมดดาร์กพร้อมใช้งาน\nแค่พิมพ์อะไรมา เดี๋ยวตอบกวนๆให้เอง 😏"
  );
});

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (text.startsWith("/start")) return; // กันซ้ำ

  try {
    const result = await model.generateContent(text);
    const reply = result.response.text();

    bot.sendMessage(chatId, `🖤 ${reply}`);
  } catch (err) {
    console.error("Gemini API Error:", err);
    bot.sendMessage(chatId, "❌ บอทกวนตีน error แป๊บ ลองใหม่ทีนะ");
  }
});


