// === ElleBot x Isaan Auntie Style ===
const TelegramBot = require("node-telegram-bot-api");
const express = require("express");

// ENV
const token = process.env.TELEGRAM_TOKEN;
if (!token) {
  console.error("❌ Missing TELEGRAM_TOKEN");
  process.exit(1);
}

// Setup HTTP (Render health check)
const app = express();
const PORT = process.env.PORT || 10000;
app.get("/", (_, res) => res.send("ElleBot อีสาน Auntie 🤭🛖💜"));
app.listen(PORT, () => console.log(`HTTP server on ${PORT}`));

// Telegram Bot
const bot = new TelegramBot(token, { polling: true });

// คำตอบแนวอีสาน Auntie
const replies = [
  "โอ้ยยลูกเอ้ยย ป้ากะอยากมีผัวฝรั่งคือกัน 😳 แต่ได้แค่มานั่งพิมพ์ด่าเจ้าล่ะเด้อ 555",
  "อย่ามาหาเรื่องเด้ออีหล่า 🤨 บ่ได้มัก แต่ถ้าเป็นฝรั่งสูงยาวขาวตี๋ กะว่าไปอย่าง 🤭",
  "ป้าบ่มีเงินดอก 😤 แต่ป้ามีฮักแท้เด้อ เอ้า! มักกะเอาไปโลดดด ❤️",
  "เฮ้ย! บักห่าดำ กล้ามาล้อป้า บอกเลยป้าสิใส่ส้นสูงตบหน้าคือแม่บักตั๋ว 🤣",
  "ชีวิตป้ามันบ่ซับซ้อนดอก กินข้าวเหนียว นอนเฮือน ฝันหาฝรั่ง 😌",
  "อยากได้ผัวฝรั่งมาลูบหัว แต่ถ้าได้เจ้ามากวนโอ๊ยนี่ ป้าสิสาดน้ำปลาร้าใส่เลยเด้อ 🤬",
  "บักหล่า! ป้าซื่อๆเด้อ แต่ว่าปากป้าคมคือมีด บ่เชื่อกะลองแหย่เบิ่ง 😏",
  "เอื้อยกะอยากแต่งโตเป็นสาวฝรั่งคือกันเด้ 😅 แต่สังขารบ่ให้แล้วลูกเอ้ย",
  "อย่ามาเฮ็ดหยังกวนใจหลาย บัดเดี๋ยวป้าสิเอาไม้กวาดฟาดหัวคือผัวบักหล่า 🤣",
  "บักบ๊องเอ๊ย! ฝรั่งยังบ่ได้ แต่ป้าสิได้ด่าคือได้ผัวชั่วคราวไปก่อน 😜"
];

// ฟังก์ชันสุ่มตอบ
function getRandomReply() {
  return replies[Math.floor(Math.random() * replies.length)];
}

// Listener
bot.on("message", (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text.toLowerCase();

  if (text.includes("สวัสดี") || text.includes("hello")) {
    bot.sendMessage(chatId, "โอ้ยสวัสดีเด้อหล่า 🛖 ป้ากำลังตำส้มตำบักหุ่งอยู่ มึงสิแดกบ่ 😆");
  } else if (text.includes("ผัว") || text.includes("ฝรั่ง")) {
    bot.sendMessage(chatId, "พูดฮอดผัวฝรั่งแล้วน้ำตาสิไหล 😭 ป้าอยากได้มาดูแลยามแก่แท้ๆ");
  } else {
    bot.sendMessage(chatId, getRandomReply());
  }
});


