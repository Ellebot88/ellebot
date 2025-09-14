// === ElleBot TH/VI — resilient boot (no crash), auto webhook/polling ===
const express = require("express");
const TelegramBot = require("node-telegram-bot-api");

const TOKEN = process.env.TELEGRAM_TOKEN || "";     // กันตาย: ไม่ exit
const PUBLIC_URL = (process.env.PUBLIC_URL || "").replace(/\/+$/, ""); // ตัด / ท้าย
const PORT = process.env.PORT || 10000;

const app = express();
app.use(express.json());

// หน้าเช็คสุขภาพ + บอกสถานะ
app.get("/", (_, res) => {
  const ok = !!TOKEN;
  res
    .status(ok ? 200 : 200)
    .send(
      ok
        ? `ElleBot is live 💅🖤 (mode=${PUBLIC_URL ? "webhook" : "polling"})`
        : "❌ Missing TELEGRAM_TOKEN — ใส่ ENV ก่อนนะคะแล้วกด Deploy ใหม่"
    );
});

// ====== Bot Persona (TH/VI) ======
function isVI(s = "") {
  return /[ăâđêôơưáàảãạấầẩẫậắằẳẵặéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ]/i.test(
    s
  );
}
function replyTH(text) {
  if (/^สวัสดี/.test(text)) return "✨ สวัสดีจ้า แม่มาละ พร้อมเสิร์ฟความเริ่ด 🖤";
  if (/ด่า/.test(text)) return "🌚 เอาด่าจริงหรือด่ากรุบกริบ ดีล่ะลูก? แม่ได้หมด 🤭";
  if (/ตลก|ขำ|ฮา/.test(text)) return "555 วิกล่นจะหลุดละเด้อออ 🌈";
  return [
    "🖤 ชีวิตมันดาร์ก แต่ลิปต้องแดงเข้าไว้จ้ะ",
    "💅 อย่ามาหมิ่น แม่สวยและซ่าส์โดยชอบธรรม",
    "🌚 เหนื่อยก็พัก แต่ความปังก็ต้องรักษานะที่รัก",
    "✨ บ่ต้องเถียงหลาย แม่ชนะตั้งแต่ยังไม่เริ่ม"
  ][Math.floor(Math.random() * 4)];
}
function replyVI(text) {
  if (/^hi|hello|chào/i.test(text)) return "💅 Chào cưng! Hôm nay muốn drama hay tiền? 🖤";
  return [
    "🖤 Cuộc đời hơi dark nhưng chị vẫn chói loá nha!",
    "💋 Dám cà khịa hả? Lên luôn nè em iu!",
    "✨ Mệt thì nghỉ, còn sang thì phải giữ.",
    "🌚 Tỉnh táo mà mặn mòi, đó là phong cách của chị."
  ][Math.floor(Math.random() * 4)];
}

// ====== Boot logic ======
let bot = null;

async function startWebhook() {
  bot = new TelegramBot(TOKEN, { polling: false });

  // endpoint ให้ Telegram ยิงเข้า
  app.post(`/webhook/${TOKEN}`, (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
  });

  // ตั้ง webhook หลัง server listen พร้อม retry
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
  console.error("❌ ตั้ง webhook ไม่สำเร็จ แต่โปรเซสยังรันอยู่ (จะลองใหม่ตอนรีสตาร์ต)");
}

async function startPolling() {
  // กัน 409 ชน: ถ้าเคย webhook ให้ลบก่อน
  try {
    const fetch = (await import("node-fetch")).default;
    await fetch(`https://api.telegram.org/bot${TOKEN}/deleteWebhook`);
  } catch (_) {}
  bot = new TelegramBot(TOKEN, { polling: true });
  console.log("✅ Polling mode started");
}

// ลง handler ให้ bot (ใช้ได้ทั้งสองโหมด)
function attachHandlers() {
  if (!bot) return;
  bot.on("message", (msg) => {
    const text = (msg.text || "").trim();
    if (!text) return;

    let ans = isVI(text) ? replyVI(text) : replyTH(text);
    bot.sendMessage(msg.chat.id, ans);
  });

  bot.onText(/^\/start$/, (msg) => {
    bot.sendMessage(
      msg.chat.id,
      "ElleBot พร้อมเมาท์ 💅\nพิมพ์ไทยหรือเวียดก็ได้ เดี๋ยวแม่จัดให้จ้า 🖤"
    );
  });

  bot.onText(/^\/ping$/, (msg) => bot.sendMessage(msg.chat.id, "ยังสวย ยังซ่าส์ ยังไม่ตายค่ะ ⚡"));
}

// เริ่ม server ก่อน แล้วเลือกโหมดให้เอง
app.listen(PORT, async () => {
  console.log(`HTTP on ${PORT}`);
  if (!TOKEN) {
    console.warn("⚠️ ไม่มี TELEGRAM_TOKEN — รันได้แค่เว็บสุขภาพ");
    return;
  }
  try {
    if (PUBLIC_URL) {
      console.log("Boot in WEBHOOK mode");
      await startWebhook();
    } else {
      console.log("Boot in POLLING mode (PUBLIC_URL not set)");
      await startPolling();
    }
    attachHandlers();
  } catch (e) {
    console.error("Boot error (ไม่ล้มโปรเซส):", e?.message || e);
  }
});
