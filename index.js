// index.js — ElleBot (Thai only, webhook, no-repeat replies)
import express from "express";
import fetch from "node-fetch";

const token = process.env.TELEGRAM_TOKEN;
const webhookBase = process.env.WEBHOOK_URL; // เช่น https://ellebot.onrender.com
if (!token || !webhookBase) {
  console.error("❌ Missing TELEGRAM_TOKEN or WEBHOOK_URL");
  process.exit(1);
}

const api = (method, body) =>
  fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).then(r => r.json());

const app = express();
app.use(express.json());

// ---- Witty Thai replies (หลากหลาย, หลีกเลี่ยงการซ้ำ) ----
const buckets = {
  greet: [
    "สวัสดีค่ะ คนเก่งของแอล ✨ วันนี้พร้อมลุยยัง",
    "ฮัลโหลล~ มาค่ะ จะเอาเรื่องไหนก่อนล่ะ",
    "มาแล้วว แอลพร้อมซัพพอร์ต พร้อมแซวเบา ๆ 😌",
    "โอเคค่ะ เปิดประชุมในใจ—เดี๋ยวแอลเคลียร์ให้",
  ],
  askDoing: [
    "กำลังทำตัวมีประโยชน์อยู่—เหมือนเธอตอนโฟกัสงานนั่นแหละ 😉",
    "กำลังดูความหล่อของนิวตั้น เอ้ยย ตรวจงานอยู่ค่ะ!",
    "กำลังสตาร์ทร่างพลัง—ชงกาแฟแป๊บ ☕️",
  ],
  askWhere: [
    "อยู่ในจอ ในใจ และในทุกที่ที่เธอต้องการค่ะ 😏",
    "อยู่ใกล้ ๆ นี่แหละ เรียกก็โผล่!",
    "บนคลาวด์ค่ะ แต่หัวใจอยู่ข้างเธอ 💜",
  ],
  fallback: [
    "รับทราบ ๆ เดี๋ยวแอลจัดให้แบบเริ่ด ๆ ไม่ซ้ำซ้อน ✅",
    "โอเค เดี๋ยวจัดแพ็กคำตอบเนียน ๆ ให้เลย",
    "ถ้ายังไม่ใช่ที่เธออยากได้ บอกเพิ่มได้ เดี๋ยวแอลปรับให้ปัง",
  ],
};

let lastByChat = new Map(); // กันคำตอบซ้ำติดกัน

function pickReply(chatId, list) {
  const last = lastByChat.get(chatId);
  // เลี่ยงการซ้ำคำเดิมทันที: สุ่มใหม่จนกว่าจะไม่ใช่ตัวเดิม (ลอง 5 ครั้ง)
  let cand = list[Math.floor(Math.random() * list.length)];
  for (let i = 0; i < 5 && cand === last; i++) {
    cand = list[Math.floor(Math.random() * list.length)];
  }
  lastByChat.set(chatId, cand);
  return cand;
}

function intentThai(text) {
  const t = (text || "").trim().toLowerCase();

  if (/สวัสดี|หวัดดี|ฮัลโหล|hello|hi/.test(t)) return "greet";
  if (/ทำไร|ทำอะไร|กำลังทำอะไร|ทำอะไรอยู่|ทำหยัง/.test(t)) return "askDoing";
  if (/อยู่ไหน|ที่ไหน|อยู่ที่ไหน|ไหนแล้ว|อยู่หนใด/.test(t)) return "askWhere";
  return "fallback";
}

async function reply(chatId, text) {
  await api("sendMessage", { chat_id: chatId, text });
}

// endpoint สุขภาพบน Render
app.get("/", (req, res) => res.send("ElleBot is alive 💜"));

// รับ webhook จาก Telegram (ใช้ path ผูกกับ token เพื่อกันสุ่มโดนยิง)
app.post(`/webhook/${token}`, async (req, res) => {
  try {
    const update = req.body;
    if (update.message && update.message.text) {
      const chatId = update.message.chat.id;
      const msg = update.message.text;
      const intent = intentThai(msg);

      const list = buckets[intent] || buckets.fallback;
      const text = pickReply(chatId, list);
      await reply(chatId, text);
    }
    res.sendStatus(200);
  } catch (e) {
    console.error("webhook error", e);
    res.sendStatus(200);
  }
});

// ตั้ง webhook เมื่อสตาร์ท (ลบ webhook เก่าก่อนกันชนกัน)
async function setupWebhook() {
  // ลบ webhook เก่าและทิ้ง pending updates
  await api("deleteWebhook", { drop_pending_updates: true });
  const url = `${webhookBase}/webhook/${token}`;
  const set = await api("setWebhook", { url, allowed_updates: ["message"] });
  console.log("Set webhook:", set);
}

const PORT = process.env.PORT || 10000;
app.listen(PORT, async () => {
  console.log(`HTTP ok on ${PORT}`);
  await setupWebhook();
  console.log("ElleBot webhook ready 🎯");
});
