// === ElleBot (TH/VI style) ===
const TelegramBot = require("node-telegram-bot-api");
const express = require("express");

// --- ENV ---
const TOKEN = process.env.TELEGRAM_TOKEN;
const PUBLIC_URL = process.env.PUBLIC_URL;

if (!TOKEN) {
  console.error("❌ Missing TELEGRAM_TOKEN");
  process.exit(1);
}
if (!PUBLIC_URL) {
  console.error("❌ Missing PUBLIC_URL");
  process.exit(1);
}

// --- Express App (for Render health + webhook) ---
const app = express();
app.use(express.json());
const PORT = process.env.PORT || 10000;

app.get("/", (_, res) => res.send("ElleBot TH/VI live 💅🖤"));

// --- Telegram bot (no polling, use webhook) ---
const bot = new TelegramBot(TOKEN, { polling: false });

app.post(`/webhook/${TOKEN}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// --- Webhook setup with retry ---
async function setWebhookWithRetry() {
  const url = `${PUBLIC_URL}/webhook/${TOKEN}`;
  let delay = 3000;
  for (let i = 1; i <= 5; i++) {
    try {
      await bot.setWebHook(url);
      console.log("✅ Webhook set:", url);
      return;
    } catch (e) {
      console.warn(`⚠️ setWebHook attempt ${i} failed:`, e?.message || e);
      await new Promise(r => setTimeout(r, delay));
      delay *= 2;
    }
  }
  console.error("❌ Webhook failed (จะลองใหม่ตอนรีสตาร์ต)");
}

app.listen(PORT, () => {
  console.log(`HTTP server running on ${PORT}`);
  setWebhookWithRetry();
});

// --- Funny Dark Replies (Thai + Vietnamese) ---
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = (msg.text || "").trim();

  let reply = null;

  if (/^สวัสดี/.test(text)) {
    reply = "✨ สวัสดีจ้าา แม่มาแล้ว 🖤 พร้อมเสิร์ฟความเริ่ด!";
  } else if (/^ด่า/.test(text)) {
    reply = "🌚 มึงอยากโดนด่าใช่บ่ กะสี้! คนสวยเขาบ่ถือโทษดอกเด้อ 🤭";
  } else if (/^hi|hello/i.test(text)) {
    reply = "💅 Chào cưng! Hôm nay muốn drama hay muốn tiền? 🖤";
  } else if (/^ตลก/.test(text)) {
    reply = "555+ กูขำจนวิกจะหลุดเด้ออ 🌈";
  } else {
    // default random funny dark style
    const randoms = [
      "🖤 กูมะคะนองกะด้อ แต่กูกะยังแซ่บ 💋",
      "✨ Chịu không nổi nữa thì vô lòng em đây này 🤭",
      "🌚 ชีวิตมันดาร์ก แต่ลิปต้องแดงเข้าไว้!",
      "💅 Mấy đứa dám cà khịa tao hả? Lên luôn nè!",
      "🖤 กูบ่ได้โหด กูแค่สวยแล้วยโสหน่อยๆ"
    ];
    reply = randoms[Math.floor(Math.random() * randoms.length)];
  }

  bot.sendMessage(chatId, reply, { parse_mode: "Markdown" });
});
