import { NextRequest } from "next/server";
import { getSupabase } from "../../../lib/supabase";
import { extractTransactionsFromInput } from "../../../lib/gemini";
import { format } from "date-fns";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const ALLOWED_CHAT_ID = Number(process.env.ALLOWED_CHAT_ID || 0);

type TelegramMessage = {
  message_id: number;
  chat: { id: number; first_name?: string };
  text?: string;
  voice?: { file_id: string; duration: number; mime_type?: string };
  date: number;
};

type TelegramUpdate = {
  update_id: number;
  message?: TelegramMessage;
};

async function sendTelegramMessage(chatId: number, text: string) {
  if (!BOT_TOKEN) return;
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "Markdown",
    }),
  });
}

async function downloadVoiceFile(fileId: string): Promise<{ base64: string; mimeType: string }> {
  // 1. Get file path
  const getFileRes = await fetch(
    `https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${fileId}`
  );
  const getFileData = await getFileRes.json();

  if (!getFileData.ok) throw new Error("Failed to get file info from Telegram");

  const filePath = getFileData.result.file_path;
  const mimeType = "audio/ogg";

  // 2. Download the actual audio
  const audioUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${filePath}`;
  const audioRes = await fetch(audioUrl);
  const audioBuffer = await audioRes.arrayBuffer();
  const base64 = Buffer.from(audioBuffer).toString("base64");

  return { base64, mimeType };
}

function buildDailySummary(date: string, txns: ExtractedTransaction[]) {
  const total = txns.reduce((sum, t) => sum + t.amount, 0);
  const sorted = [...txns].sort((a, b) => b.amount - a.amount);
  const highest = sorted[0];
  const lowest = sorted[sorted.length - 1];

  const dateDisplay = format(new Date(date), "dd-MM-yyyy");

  let msg = `Daily Expense Summary\n`;
  msg += `Date: ${dateDisplay}\n\n`;
  msg += `Total Spent Today: ₹${total}\n`;
  msg += `Highest Spend: ${highest.description} - ₹${highest.amount}\n`;
  msg += `Lowest Spend: ${lowest.description} - ₹${lowest.amount}\n\n`;
  msg += `✅ ${txns.length} transaction${txns.length === 1 ? "" : "s"} recorded successfully.`;

  return msg;
}

type ExtractedTransaction = {
  date: string;
  description: string;
  category: string;
  amount: number;
};

export async function POST(req: NextRequest) {
  try {
    const update: TelegramUpdate = await req.json();

    const msg = update.message;
    if (!msg || !msg.chat) {
      return new Response("ok");
    }

    const chatId = msg.chat.id;

    // Security: only your account
    if (ALLOWED_CHAT_ID && chatId !== ALLOWED_CHAT_ID) {
      await sendTelegramMessage(
        chatId,
        `This bot is private. Your chat ID is: ${chatId}\n\nIf this is you, set ALLOWED_CHAT_ID to this exact number on Vercel and redeploy.`
      );
      return new Response("ok");
    }

    // Basic commands
    if (msg.text && msg.text.startsWith("/")) {
      if (msg.text === "/start" || msg.text === "/help") {
        await sendTelegramMessage(
          chatId,
          "Hi! Send me your daily expenses as text or voice note.\n\nExample: `tiffin 60, shawarma 170, petrol 300`\n\nI will categorize, store, and send a clean summary."
        );
      }
      return new Response("ok");
    }

    let extracted: ExtractedTransaction[] = [];

    // === VOICE HANDLING (Day 1 requirement) ===
    if (msg.voice) {
      try {
        const { base64, mimeType } = await downloadVoiceFile(msg.voice.file_id);
        extracted = await extractTransactionsFromInput({
          audioBase64: base64,
          mimeType,
        });
      } catch (e) {
        console.error("Voice processing failed:", e);
        await sendTelegramMessage(
          chatId,
          "Sorry, I had trouble with that voice note. Can you send the expenses as text instead?"
        );
        return new Response("ok");
      }
    }

    // === TEXT HANDLING ===
    else if (msg.text) {
      extracted = await extractTransactionsFromInput({ text: msg.text });
    }

    if (extracted.length === 0) {
      await sendTelegramMessage(
        chatId,
        "I couldn't find any clear expenses in that message. Try again with amounts and items (e.g. \"tiffin 60 + petrol 400\" or just speak it)."
      );
      return new Response("ok");
    }

    // Insert into Supabase
    const rowsToInsert = extracted.map((t) => ({
      date: t.date,
      description: t.description,
      category: t.category,
      amount: t.amount,
      source: msg.voice ? "telegram_voice" : "telegram_text",
      raw_input: msg.voice ? "[voice note]" : msg.text,
    }));

    // @ts-expect-error - Supabase types will be generated later from your project schema
    const { error } = await getSupabase().from("transactions").insert(rowsToInsert);

    if (error) {
      console.error("Supabase insert error:", error);
      await sendTelegramMessage(chatId, "Saved to my brain but failed to store in DB. I'll retry later.");
      return new Response("ok");
    }

    // Build and send the beautiful daily summary (grouped by the date of the first txn)
    const mainDate = extracted[0].date;
    const sameDayTxns = extracted.filter((t) => t.date === mainDate);
    const summary = buildDailySummary(mainDate, sameDayTxns);

    await sendTelegramMessage(chatId, summary);

    return new Response("ok", { status: 200 });
  } catch (err) {
    console.error("Telegram webhook error:", err);
    return new Response("ok"); // Always 200 so Telegram doesn't retry forever
  }
}

// Health check
export async function GET() {
  return Response.json({ ok: true, service: "telegram-webhook" });
}
