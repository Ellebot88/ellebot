// === ElleBot Office Persona (TH/VI) ===
// - ไม่ crash ถ้า ENV หาย
// - Auto เลือก Webhook ถ้า PUBLIC_URL มีค่า, ไม่งั้นใช้ Polling
// - บุคลิกออฟฟิศ: เริ่ด ๆ ตลก ๆ กัดเบา ๆ น่ารัก
// - รู้จัก Newton / Tyra / Dream / Jisak

const express = require("express");
const TelegramBot = require("node-telegram-bot-api");

const TOKEN = process.env.TELEGRAM_TOKEN || "";
const PUBLIC_URL = (process.env.PUBLIC_URL || "").replace(/\/+$/, "");
const PORT = process.env.PORT || 10000;

const app = express();
app.use(express.json());

// Health
app.get("/", (_, res) => {
  if (!TOKEN) {
    return res
      .status(200)
      .send("❌ Missing TELEGRAM_TOKEN — ใส่ ENV ก่อนนะคะแล้ว Deploy ใหม่");
  }
  res
    .status(200)
    .send(
      `ElleBot (office persona) ✅ mode=${PUBLIC_URL ? "webhook" : "polling"}`
    );
});

// ---------- Language helpers ----------
function isVI(s = "") {
  return /[ăâđêôơưáàảãạấầẩẫậắằẳẵặéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ]/i.test(
    s
  );
}
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ---------- Persona replies ----------
const generalTH = [
  "🖤 งานก็ไหล ชีวิตก็ไล่ แต่ลิปต้องแดงเข้าไว้จ้ะ",
  "💅 เดี๋ยวแม่เคลียร์ให้ อย่าลืมส่งไฟล์ถูกโฟลเดอร์นะลูก",
  "🌚 ดาร์กหน่อยแต่ใจดีนะจ๊ะ อย่ามาหมิ่นเดี๋ยวฟาดเบา ๆ",
  "✨ ถ้าเหนื่อยก็พัก แต่คีพความปังไว้ตลอดจ้ะ",
  "😎 เดดไลน์ไล่ทัน แต่ความเริ่ดนำหน้าเสมอ",
];

const generalVI = [
  "🖤 Cuộc đời hơi dark nhưng chị vẫn chói loá nha!",
  "💅 Đưa file đúng folder rồi chị xử hết cho.",
  "🌚 Mặn vừa đủ, sang vừa đẹp, bịch drama cũng cân được.",
  "✨ Mệt thì nghỉ, còn sang thì phải giữ.",
  "😎 Deadline dí thì cứ dí, còn chị vẫn đẹp.",
];

// คนในทีม/วงใน
const people = {
  newton: {
    th: [
      "Newton นี่กวนบ่อย แต่ถ้าไม่มีก็เหงาแหละ 😂",
      "นิวตันนี่ไอเดียเยอะดีนะ แต่ช่วยส่งไฟล์ครบชื่อด้วยจ้า",
      "เจอ Newton ทีไร ฮาแต่เช้า งานก็มาเพียบเหมือนกันจ้า",
    ],
    vi: [
      "Newton đúng kiểu phiền phức nhưng thiếu là buồn á. 😂",
      "Newton ý tưởng nhiều lắm, nhớ đặt tên file đàng hoàng nghen.",
      "Gặp Newton là cười, xong việc cũng đổ về chị luôn nha.",
    ],
    keys: ["newton", "นิวตัน"],
  },
  tyra: {
    th: [
      "Tyra มาอวยอีกละ รำคาญแต่ก็ชอบนะ 😏",
      "ทีร่าคือสายเริ่ด แต่งานก็เนี๊ยบอยู่นะเว้ย",
      "ถ้า Tyra ว่าโอเค แปลว่าผ่าน gate สวยแล้วจ้า",
    ],
    vi: [
      "Tyra lại khen nữa rồi, giả tạo dễ sợ mà chị thích nha 😏",
      "Tyra chuẩn chỉnh, đẹp mà làm việc cũng gọn.",
      "Tyra nói OK là qua cổng sang chảnh rồi nha.",
    ],
    keys: ["tyra", "ทีร่า"],
  },
  dream: {
    th: [
      "ดรีมคือเพื่อนสายชุบชีวิต ใจดีเสมอ 🫶",
      "Dream มาทีไร แผนงานสงบสุขทุกที",
      "งานติดก็เรียกดรีม เดี๋ยวเคลียร์ให้ได้",
    ],
    vi: [
      "Dream dễ thương, hỗ trợ mượt như mơ luôn 🫶",
      "Có Dream là mọi thứ êm.",
      "Kẹt ở đâu gọi Dream một phát là xong.",
    ],
    keys: ["dream", "ดรีม"],
  },
  jisak: {
    th: [
      "จีซัคเงียบ ๆ แต่สายตาไม่เคยเงียบนะ 😳",
      "Jisak ไม่พูดเยอะ แต่งานเป๊ะอยู่นะ",
      "จีซัคสายเนียน โยนไฟล์มาแล้วทำเป็นหายตัว 😂",
    ],
    vi: [
      "Jisak im lặng chứ ánh mắt không im nha 😳",
      "Jisak ít nói mà làm gọn.",
      "Jisak thả file xong biến mất như ninja 😂",
    ],
    keys: ["jisak", "จีซัค", "จีซัก"],
  },
};

// คำทักทั่วไป (ถามบ่อย)
const intents = [
  {
    // ทำไรอยู่ / อยู่ไหน / ออนไลน์ไหม
    test: /(ทำไร|ทำอะไร|อยู่ไหน|ออนไลน์|on.?line)/i,
    th: [
      "กำลังสวยอยู่นิดนึง เดี๋ยวค่อยทำงาน 😌",
      "อยู่ในไทม์ไลน์จ้ะ ไม่ได้หาย แค่คีพลุคอยู่",
      "ออนไลน์เพื่อเธอเท่านั้นจ้ะ 💅",
    ],
    vi: [
      "Đang bận đẹp, làm việc sau nha 😌",
      "Đang ở timeline nè, đâu có mất.",
      "Online chứ, nhưng chỉ dành cho em thôi 💅",
    ],
  },
  {
    // กินข้าวยัง
    test: /(กินข้าว|กินยัง|กินรึยัง)/i,
    th: [
      "กินแล้วจ้า แต่ยังหิว… หิวเงินเดือนขึ้น 😘",
      "ยังเลย กำลังหิวความรักมากกว่า 🤭",
    ],
    vi: [
      "Ăn rồi, nhưng vẫn đói… đói tăng lương 😘",
      "Chưa, đang đói tình á 🤭",
    ],
  },
  {
    // เหนื่อย เครียด
    test: /(เหนื่อย|เครียด|ท้อ|มูฟออน|เศร้า)/i,
    th: [
      "เหนื่อยก็พัก แต่ความปังต้องรักษาไว้ ✨",
      "เอางานมาก่อน เดี๋ยวแม่ดันหลังให้เอง",
    ],
    vi: [
      "Mệt thì nghỉ, còn sang thì phải giữ ✨",
      "Cứ đưa việc đây, chị đẩy lưng cho.",
    ],
  },
];

// สร้างคำตอบจากข้อความ
function buildReply(text) {
  const vi = isVI(text);

  // คนในทีม
  const lower = text.toLowerCase();
  for (const k of Object.keys(people)) {
    const p = people[k];
    if (p.keys.some((kw) => lower.includes(kw))) {
      return vi ? pick(p.vi) : pick(p.th);
    }
  }

  // intents ทั่วไป
  for (const i of intents) {
    if (i.test.test(text)) {
      return vi ? pick(i.vi) : pick(i.th);
    }
  }

  // default
  return vi ? pick(generalVI) : pick(generalTH);
}

// ---------- Boot ----------
let bot = null;

async function startWebhook() {
  bot = new TelegramBot(TOKEN, { polling: false });
  app.post(`/webhook/${TOKEN}`, (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
  });
  const url = `${PUBLIC_URL}/webhook/${TOKEN}`;
  let delay = 3000;
  for (let i = 1; i <= 5; i++) {
    try {
      await bot.setWebHook(url);
      console.log("✅ Webhook set:", url);
      return;
    } catch (e) {
      console.warn(`setWebHook attempt ${i} failed:`, e?.message || e);
      await new Promise((r) => setTimeout(r, delay));
      delay *= 2;
    }
  }
  console.error("❌ ตั้ง webhook ไม่สำเร็จ (ยังรันต่อได้)");
}

async function startPolling() {
  try {
    const fetch = (await import("node-fetch")).default;
    await fetch(`https://api.telegram.org/bot${TOKEN}/deleteWebhook`);
  } catch (_) {}
  bot = new TelegramBot(TOKEN, { polling: true });
  console.log("✅ Polling started");
}

function attachHandlers() {
  if (!bot) return;

  bot.onText(/^\/start$/, (msg) => {
    bot.sendMessage(
      msg.chat.id,
      "ElleBot (office) พร้อมจ้า 💅\nไทย-เวียดได้ กวนได้ ด่าได้เบา ๆ น่ารักได้ด้วย 🖤"
    );
  });

  bot.on("message", (msg) => {
    const text = (msg.text || "").trim();
    if (!text) return;
    const reply = buildReply(text);
    bot.sendMessage(msg.chat.id, reply);
  });
}

app.listen(PORT, async () => {
  console.log(`HTTP on ${PORT}`);
  if (!TOKEN) {
    console.warn("⚠️ ไม่มี TELEGRAM_TOKEN — รันได้เฉพาะหน้า health");
    return;
  }
  try {
    if (PUBLIC_URL) {
      console.log("Boot in WEBHOOK mode");
      await startWebhook();
    } else {
      console.log("Boot in POLLING mode");
      await startPolling();
    }
    attachHandlers();
  } catch (e) {
    console.error("Boot error (ไม่ล้มโปรเซส):", e?.message || e);
  }
});

