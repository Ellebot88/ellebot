// === ElleBot Office (Thai only, max sass) ===
// - บุคลิก: เริ่ด ตลก กวน จิกกัดได้ (ปรับระดับได้)
// - รู้จัก Newton / Tyra / Dream / Jisak
// - Auto webhook/polling + ไม่ล้มง่าย
const express = require("express");
const TelegramBot = require("node-telegram-bot-api");

const TOKEN = process.env.TELEGRAM_TOKEN || "";
const PUBLIC_URL = (process.env.PUBLIC_URL || "").replace(/\/+$/, "");
const PORT = process.env.PORT || 10000;

const app = express();
app.use(express.json());

// -------- Utils --------
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const timeGreeting = () => {
  const h = new Date().getHours();
  if (h < 5) return "ยังไม่นอนอีกเหรอคะ เดี๋ยวใต้ตาดำไม่สวยนะ 😌";
  if (h < 12) return "อรุณสวัสดิ์แม่สาวออฟฟิศ ☀️ ลิปแน่นยัง";
  if (h < 18) return "บ่ายนี้ประชุมอีกกี่ห้องคะลูก 😵‍💫";
  return "เย็นนี้กินอะไรดีคะ—นอกจากดราม่า 😏";
};

// -------- Persona bank (ไทยล้วน) --------
const generalGentle = [
  "แม่อยู่ตรงนี้จ้ะ ใจเย็น ๆ เดี๋ยวจัดให้",
  "เหนื่อยก็พัก แต่คุณค่าความปังอย่าให้ตก ✨",
  "เดี๋ยวแม่ช่วยคิดทางออกให้นะคะ",
  "วันนี้สวยกว่าเดิมนิดนึงพอหอมปากหอมคอ 💅",
];

const generalSassy = [
  "งานล้นมือแต่ลิปต้องแดงก่อนค่ะ",
  "ดาร์กหน่อยแต่ใจดีนะคะ อย่ามาหมิ่นเดี๋ยวฟาดเบา ๆ",
  "เครียดทำไมคะ เดี๋ยวแม่จัดการให้—อย่างเริ่ด",
  "ใครแรงได้ แม่ก็แรงได้ แต่มีคลาสกว่า 😌",
];

const generalSpicy = [
  "อย่ามาทำปากดีนะคะ เดี๋ยวแม่ดุแบบมีชั้นเชิง 😘",
  "งานกองเท่าภูเขา แต่คิ้วต้องฟูฟ่องไว้ก่อน",
  "ถ้าจะเท แม่ก็เทกลับแบบแพง ๆ ได้เหมือนกัน",
  "เหนื่อยนักก็ซบไหล่แม่…เสร็จแล้วก็ไปลุยงานต่อจ้ะ 😏",
];

// วงใน
const bank = {
  Newton: {
    keys: [/newton/i, /นิวตัน/i],
    gentle: [
      "Newton ขำเก่งนะ แต่พึ่งได้อยู่ น่ารักแหละ",
      "พูดถึง Newton แล้วบรรยากาศดีขึ้นทุกที",
    ],
    sassy: [
      "Newton กวนตีนเป็นงานอดิเรก แต่ถ้าไม่มีจะเหงามาก 😂",
      "นิวตันนี่ไอเดียพุ่งแรง แต่อย่าลืมตั้งชื่อไฟล์ดี ๆ ด้วยค่ะ",
    ],
    spicy: [
      "Newton อย่ากวนมาก เดี๋ยวแม่ฟาดด้วยเดดไลน์นะคะ 😘",
      "ใครก่อดราม่า…อุ๊ย เผลอคิดถึง Newton อีกละ 😏",
    ],
  },
  Tyra: {
    keys: [/tyra/i, /ทีร่า/i],
    gentle: [
      "Tyra สวยและใจดี งานเนี๊ยบมาก",
      "ถ้า Tyra โอเค แปลว่าผ่านเกณฑ์คุณภาพแล้วจ้ะ",
    ],
    sassy: [
      "ทีร่ามาอวยอีกละ รำคาญแต่กูก็ชอบ 🤭",
      "Tyra คือคัดกรองความปัง ฝุ่นจับไม่ได้ค่ะ",
    ],
    spicy: [
      "Tyra ถ้าจะชมก็โอนเงินมาด้วย จะได้เชื่อว่าอิน 😌",
      "พูดถึง Tyra ต้องมีประกายกลิตเตอร์ประกอบเสมอ 💅",
    ],
  },
  Dream: {
    keys: [/dream/i, /ดรีม/i],
    gentle: [
      "ดรีมเป็นนางฟ้าประจำทีมจริง ๆ 🫶",
      "ติดตรงไหนบอก Dream ได้เลย มนุษย์ซัพพอร์ตตัวท็อป",
    ],
    sassy: [
      "Dream มาเมื่อไหร่ งานนิ่งเมื่อนั้น",
      "ดรีมคือ Soft Power ของทีมตัวจริง",
    ],
    spicy: [
      "Dream อย่าใจดีเกิน เดี๋ยวคนเคยตัวนะคะ 😉",
      "ให้ดรีมช่วยก็ได้ แต่ต้องมีของกินแลกหน่อยสิ 🍰",
    ],
  },
  Jisak: {
    keys: [/jisak/i, /จีซัค/i, /จีซัก/i],
    gentle: [
      "จีซัคเงียบ ๆ แต่สกิลแน่นมากนะ",
      "Jisak ไม่ค่อยพูด แต่งานสวยเสมอ",
    ],
    sassy: [
      "จีซัคตาไม่เงียบเท่าปากนะคะ ระวังใจสั่น 😳",
      "ไฟล์มาละหายตัว—สไตล์จีซัคเค้าแหละ 😂",
    ],
    spicy: [
      "Jisak ถ้าจะหายไปแบบนี้ แม่จะส่งใบเตือนเลยนะคะ 😌",
      "จีซัคจ้า อ่านแล้วตอบด้วย อย่าทำเป็นเงียบสายเนียน",
    ],
  },
};

// อินเทนต์ยอดฮิต
const intents = [
  {
    test: /(ทำไร|ทำอะไร|อยู่ไหน|ออนไลน์|ทัก|hi|hello)/i,
    gentle: [
      "กำลังตอบแชตอย่างงดงามอยู่ค่ะ ✨",
      "อยู่นี่จ้า ใจเย็น เดี๋ยวแม่มาค่ะ",
    ],
    sassy: [
      "กำลังสวยอยู่เด้อ งานรอได้สองวิ 😌",
      "ออนไลน์เพื่อเธอคนเดียวเลยค่ะ 💅",
    ],
    spicy: [
      "อยากได้คำตอบเร็ว ๆ ก็อย่าทักซ้อนสิบช่องนะคะ 😘",
      "มาเลยจ้ะ แม่พร้อมปั้นให้เริ่ด",
    ],
  },
  {
    test: /(กินข้าว|กินยัง|หิว|กาแฟ)/i,
    gentle: [
      "กินแล้วค่ะ แต่ยังหิวความสุขอยู่ 😋",
      "ยังเลย กำลังจะชวนเธอไปกินพอดี",
    ],
    sassy: [
      "กินแล้ว แต่ยังอยากกินเงินเดือนขึ้นอีกหน่อยค่ะ 😏",
      "กาแฟแก้วนึงกับกำลังใจสองช้อนโต๊ะ จัดค่ะ",
    ],
    spicy: [
      "หิวมาก แต่ถ้าไม่มีของหวาน แม่งดคุยนะคะ 🍰",
      "กินแล้ว—เหลือกินคนปากเก่งค่ะ 😘",
    ],
  },
  {
    test: /(เหนื่อย|เครียด|ท้อ|เศร้า|ร้องไห้)/i,
    gentle: [
      "เหนื่อยก็พักก่อนค่ะ เดี๋ยวแม่ค่อยดันต่อให้",
      "กอดก่อนหนึ่งที แล้วลุยใหม่ได้",
    ],
    sassy: [
      "เหนื่อยก็พัก แต่ความปังต้องคีพไว้ ✨",
      "ร้องได้ แต่อย่าลืมเช็ดมาสคาร่าเดี๋ยวเลอะ",
    ],
    spicy: [
      "ร้องเสร็จแล้วกลับมาปังต่อค่ะ น้ำตาไม่ช่วยปิดงานนะ",
      "เครียดได้ แต่ห้ามโทร.หาแฟนเก่า—แม่ไม่อนุญาต 😌",
    ],
  },
];

// ระดับความแซ่บ (ค่าเริ่มต้น: sassy)
let MODE = "sassy"; // "gentle" | "sassy" | "spicy"

// สุ่มตามโหมด
function fromMode(gentle, sassy, spicy) {
  if (MODE === "gentle") return pick(gentle);
  if (MODE === "spicy") return pick(spicy);
  return pick(sassy);
}

function replyGeneral() {
  return fromMode(generalGentle, generalSassy, generalSpicy);
}

function replyIntent(text) {
  for (const it of intents) {
    if (it.test.test(text)) return fromMode(it.gentle, it.sassy, it.spicy);
  }
  return null;
}

function replyPeople(text) {
  const lower = text.toLowerCase();
  for (const name in bank) {
    const p = bank[name];
    if (p.keys.some((re) => re.test(lower))) {
      return fromMode(p.gentle, p.sassy, p.spicy);
    }
  }
  return null;
}

// -------- Boot & handlers --------
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
      break;
    } catch (e) {
      console.warn(`setWebHook attempt ${i} failed:`, e?.message || e);
      await new Promise((r) => setTimeout(r, delay));
      delay *= 2;
    }
  }
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

  bot.onText(/^\/start$/i, (msg) => {
    bot.sendMessage(
      msg.chat.id,
      `ElleBot Office มาจ้า 💅\n• ภาษาไทยล้วน\n• โหมดตอนนี้: ${MODE}\n• คำสั่ง: /mode gentle|sassy|spicy, /vibe, /help\n\n${timeGreeting()}`
    );
  });

  bot.onText(/^\/help$/i, (msg) => {
    bot.sendMessage(
      msg.chat.id,
      "คำสั่งมีดังนี้จ้า:\n" +
        "• /mode gentle|sassy|spicy — ปรับระดับความแซ่บ\n" +
        "• /vibe — สุ่มแคปชันเริ่ด ๆ\n" +
        "• พิมพ์ชื่อ Newton / Tyra / Dream / Jisak แล้วดูแม่เมาท์ 🤭"
    );
  });

  bot.onText(/^\/mode\s+(gentle|sassy|spicy)$/i, (msg, m) => {
    MODE = m[1].toLowerCase();
    const text =
      MODE === "gentle"
        ? "ปรับเป็นโหมดสุภาพละจ้ะ นุ่มนวลแต่ยังคีพความปัง ✨"
        : MODE === "spicy"
        ? "โหมดเผ็ดร้อนเปิดแล้วจ้า ระวังแม่ฟาดแบบแพง ๆ 😘"
        : "โหมดจริตมาตรฐานพร้อมค่ะ—แซ่บกำลังดี 💅";
    bot.sendMessage(msg.chat.id, text);
  });

  bot.onText(/^\/vibe$/i, (msg) => {
    const vibes = [
      "เงียบให้สุด คมให้จำ ⚔️",
      "ไม่รับดราม่า รับแต่เงินเดือนขึ้น 💸",
      "แพงแต่ไม่พูดเยอะ 🖤",
      "ทำงานให้ทัน ใจอย่าอ่อนไหว",
      "ชนะเงียบ ๆ ให้คนงงเล่น ✨",
    ];
    bot.sendMessage(msg.chat.id, pick(vibes));
  });

  bot.on("message", (msg) => {
    const text = (msg.text || "").trim();
    if (!text || text.startsWith("/")) return;

    // ลำดับ: คนในทีม -> อินเทนต์ -> ทั่วไป
    const p = replyPeople(text);
    const i = p ? null : replyIntent(text);
    const g = p || i || replyGeneral();
    bot.sendMessage(msg.chat.id, g);
  });
}

// -------- Health --------
app.get("/", (_, res) => {
  if (!TOKEN) {
    return res
      .status(200)
      .send("❌ Missing TELEGRAM_TOKEN — ใส่แล้ว Deploy ใหม่ค่ะ");
  }
  const mode = PUBLIC_URL ? "webhook" : "polling";
  res.status(200).send(`ElleBot Office live ✅ (${mode})`);
});

// -------- Start server --------
app.listen(PORT, async () => {
  console.log(`HTTP on ${PORT}`);
  if (!TOKEN) return console.warn("⚠️ ไม่มี TELEGRAM_TOKEN");
  try {
    if (PUBLIC_URL) await startWebhook();
    else await startPolling();
    attachHandlers();
  } catch (e) {
    console.error("Boot error (ไม่ล้มโปรเซส):", e?.message || e);
  }
});
