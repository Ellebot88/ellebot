// === ElleBot — TH/VI sassy + dark humor (Webhook, no 409) ===
const express = require("express");
const TelegramBot = require("node-telegram-bot-api");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// ----- ENV -----
const TOKEN = process.env.TELEGRAM_TOKEN;
const PUBLIC_URL = process.env.PUBLIC_URL; // e.g. https://ellebot.onrender.com
const GEMINI_KEY = process.env.GEMINI_API_KEY;
if (!TOKEN) { console.error("❌ Missing TELEGRAM_TOKEN"); process.exit(1); }
if (!PUBLIC_URL) { console.error("❌ Missing PUBLIC_URL"); process.exit(1); }
if (!GEMINI_KEY) { console.error("❌ Missing GEMINI_API_KEY"); process.exit(1); }

// ----- Web server (Render health + Webhook) -----
const app = express();
app.use(express.json());
const PORT = process.env.PORT || 10000;

// Create bot WITHOUT polling (webhook mode)
const bot = new TelegramBot(TOKEN, { polling: false });

// Webhook endpoint
app.post(`/webhook/${TOKEN}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// Set webhook on boot
(async () => {
  try {
    const url = `${PUBLIC_URL}/webhook/${TOKEN}`;
    await bot.setWebHook(url);
    console.log("✅ Webhook set:", url);
  } catch (e) {
    console.error("❌ setWebHook failed:", e?.message || e);
    process.exit(1);
  }
})();

app.get("/", (_, res) => res.send("ElleBot TH/VI is live 💅🖤"));
app.listen(PORT, () => console.log(`HTTP on ${PORT}`));

// ----- Gemini -----
const genAI = new GoogleGenerativeAI(GEMINI_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// ----- Lang mode: 'auto' | 'th' | 'vi' -----
let langMode = "auto";

// tiny rate-limit + retry (prevents quota bursts)
const RATE_LIMIT_MS = 1500;
let lastCall = 0;
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
async function withRateLimit() {
  const wait = Math.max(0, RATE_LIMIT_MS - (Date.now() - lastCall));
  if (wait) await sleep(wait);
  lastCall = Date.now();
}

// quick VI detector
function looksVietnamese(s = "") {
  return /[ăâđêôơưáàảãạấầẩẫậắằẳẵặéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ]/i.test(s);
}

// Persona prompt
function buildPrompt(text, user, langSel) {
  const lang = langSel === "auto" ? (looksVietnamese(text) ? "vi" : "th") : langSel;

  const base = `
คุณคือ "ElleBot" บุคลิก glam, เริ่ด ดาร์ก ตลก มีจริตแบบสาวสายมั่น แต่ไม่หยาบคาย/ไม่เหยียด
- ตอบสั้น กระชับ แซวได้กวนได้แต่สุภาพพอประมาณ
- หลีกเลี่ยงเนื้อหาคุกคามหรืออันตราย
- ถ้าผู้ใช้ถามวิชาการ ให้ตอบสั้นๆ แล้วหยอดมุกนิดนึง
`;

  const thTone = `
รูปแบบภาษา: ไทยล้วน โทนมั่นหน้าแต่เอ็นดู เช่น "ที่รัก", "แม่ว่า", "ลูกจ๋า"
ห้ามพิมพ์อังกฤษยาวๆ เกินจำเป็น
`;
  const viTone = `
Ngôn ngữ: tiếng Việt tự tin, mặn mà, châm biếm nhẹ, kiểu "chị đẹp/ em iu".
Tránh dùng tiếng Anh không cần thiết.
`;

  const inst = lang === "vi" ? viTone : thTone;

  return `
${base}
${inst}
Tên người dùng/ชื่อผู้ใช้: ${user || "-"}
Câu hỏi/ข้อความ: ${text}

Hãy/โปรด ตอบสั้นๆ เพียง 1–2 ประโยค ตามโทนที่กำหนด:`;
}

// Gemini call with retry/backoff
async function aiReply(msgText, name) {
  const MAX_RETRY = 3;
  let delay = 10_000;

  for (let i = 0; i < MAX_RETRY; i++) {
    try {
      await withRateLimit();
      const prompt = buildPrompt(msgText, name, langMode);
      const r = await model.generateContent(prompt);
      let out = (r.response.text() || "").trim();

      // keep it short + avoid random English paragraphs
      if (out.length > 180) out = out.slice(0, 180) + "…";
      if (/[a-zA-Z]{8,}/.test(out)) out = looksVietnamese(msgText) ? "Nói tiếng Việt cho sang xịn nhé cưng 😘" : "ขอไทยล้วนจ้ะ ตัวแม่ไม่สปีคอิ๊งยาว ๆ 😌";
      return out || (looksVietnamese(msgText) ? "Nói gì rõ hơn xíu coi, chị đẹp nghe chưa? 😉" : "พูดมาอีกนิด แม่ยังไม่อินเลยลูก 😘");
    } catch (e) {
      const m = (e?.message || "").toLowerCase();
      const is429 = m.includes("429") || m.includes("quota") || m.includes("too many requests");
      if (is429 && i < MAX_RETRY - 1) {
        await sleep(delay);
        delay *= 2;
        continue;
      }
      return looksVietnamese(msgText)
        ? "Server đang kẹt hàng chút xíu, đợi chị đẹp thởก่อน nha 😮‍💨"
        : "ระบบแน่นนิดนึง รอแม่หายใจแพ้บส์ 😮‍💨";
    }
  }
}

// ----- Commands -----
bot.onText(/^\/start$/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    "💅 ElleBot สายเริ่ด TH/VI พร้อมเมาท์\n/ask ข้อความ — ถามมาเดี๋ยวแม่จิกตอบ\n/lang th|vi|auto — เลือกภาษา (ตอนนี้: " + langMode + ")\n/ping — เช็กชีพจร"
  );
});
bot.onText(/^\/ping$/, (msg) => bot.sendMessage(msg.chat.id, "ยังสวย ยังซ่าส์ ยังไม่ตายค่ะ ⚡"));

bot.onText(/^\/lang\s+(th|vi|auto)$/i, (msg, m) => {
  langMode = m[1].toLowerCase();
  const text =
    langMode === "vi"
      ? "Đã chuyển qua tiếng Việt. Lên đồ đi em iu 💋"
      : langMode === "th"
      ? "ปรับเป็นภาษาไทยเรียบร้อย ตัวแม่ขึ้นสเตจ 💋"
      : "โหมดออโต้จ้า พิมพ์ภาษาไหน แม่ก็ออกรสชาตินั้น 💅";
  bot.sendMessage(msg.chat.id, text);
});

bot.onText(/^\/ask\s+([\s\S]+)$/i, async (msg, m) => {
  const q = (m && m[1])?.trim();
  if (!q) return bot.sendMessage(msg.chat.id, "พิมพ์ /ask ตามด้วยคำถามก่อนสิคะลูก 😘");
  const ans = await aiReply(q, msg.from.first_name);
  bot.sendMessage(msg.chat.id, `🖤 ${ans}`);
});

// fallback for any text
bot.on("message", async (msg) => {
  if (!msg.text || msg.text.startsWith("/")) return;
  const ans = await aiReply(msg.text, msg.from.first_name);
  bot.sendMessage(msg.chat.id, `🖤 ${ans}`);
});



