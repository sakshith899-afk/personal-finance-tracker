import { NextRequest } from "next/server";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const ALLOWED_CHAT_ID = Number(process.env.ALLOWED_CHAT_ID || 0);

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

export async function GET(req: NextRequest) {
  // Simple protection: require a secret or just rely on Vercel cron being private
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (!ALLOWED_CHAT_ID) {
    return new Response("No chat ID configured", { status: 400 });
  }

  const reminderText = `> Personal Finance Manager:\nREMINDER! TRANSACTIONS PLEASE`;

  await sendTelegramMessage(ALLOWED_CHAT_ID, reminderText);

  return Response.json({ success: true, sent: true });
}
