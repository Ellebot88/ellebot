// === ElleBot: dark + sassy ===
const TelegramBot = require("node-telegram-bot-api");
const express = require("express");

const token = process.env.TELEGRAM_TOKEN;
if (!token) {
  console.error("Missing TELEGRAM_TOKEN. Set it in Render > Environment.");
  process.exit(1);
}

// polling = ง่ายสุด ไม่ต้องตั้ง webhook
const bot = new TelegramBot(token, { polling: true });

// ──────────── สไตล์ตอบโต้ ────────────
const brand = "⚡️ ElleBot";
const helloLines = [
  "สวัสดีค่ะ น้องดื้อเรียกพี่หรอ 😏",
  "มีไรคะ คนสวยว่างให้ 3 นาที 💅",
  "ว่าไง กล้าแชทมาก็ดี กล้ารวยด้วยหรือยัง 💸"
];

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// /start
bot.onText(/^\/start$/, (msg) => {
  const name = msg.from.first_name || "you";
  bot.sendMessage(
    msg.chat.id,
    `${brand}\n\nเฮ้ย ${name} มาถูกที่ละ\n/commands – เมนูคำสั่ง\n/checkin – เช็กอินสวยๆ\n/vibe – สเตตัสดาร์กๆเท่ๆ\n/help – งงอะไรร้องมา`,
    { disable_web_page_preview: true }
  );
});

// /commands
bot.onText(/^\/commands$/, (msg) => {
  bot.sendMessage(msg.chat.id,
`🖤 คำสั่งหลัก
/start – เริ่ม
/commands – เมนู
/checkin – เช็กอินทำงาน (ลุคคูล)
/vibe – ส่งแคปชันดาร์กๆหนึ่งดอก
/ping – ทดสอบว่าบอทตื่นอยู่ไหม
/help – วิธีใช้`,
  );
});

// /checkin
bot.onText(/^\/checkin(?:\s+(.+))?$/, (msg, match) => {
  const note = (match && match[1]) ? match[1] : "เข้าทำงานแบบคูลๆ";
  bot.sendMessage(msg.chat.id, `✅ เช็กอินเรียบร้อย: ${note}\n#TeamElle`);
});

// /vibe – ส่งประโยคดาร์กๆกวนๆ
bot.onText(/^\/vibe$/, (msg) => {
  const vibes = [
    "ใจเย็นแต่ไม่เย่อหยิ่ง แพงแต่ไม่พูดเยอะ 🖤",
    "ไม่ต้องตะโกนดัง—คนแพงเขาได้ยินกันในใจ 😌",
    "เงียบให้สุด แล้วคมให้จำ. ⚔️",
    "ชอบคนจริงใจ ที่เหลือพักก่อนค่ะ 💋",
    "วันนี้ไม่รับพลังลบ รับแต่เงินสด 💵"
  ];
  bot.sendMessage(msg.chat.id, pick(vibes));
});

// /ping
bot.onText(/^\/ping$/, (msg) => bot.sendMessage(msg.chat.id, "pong 🦋"));

// ตอบข้อความทั่วไปสั้นๆกวนๆ
bot.on("message", (msg) => {
  if (msg.text && !msg.text.startsWith("/")) {
    bot.sendMessage(msg.chat.id, pick(helloLines));
  }
});

// ──────────── web server (สำหรับ Render) ────────────
const app = express();
app.get("/", (_, res) => res.send("ElleBot is running. 🖤"));
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`HTTP ok on ${PORT}`));
