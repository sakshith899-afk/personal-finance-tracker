# Personal Finance Tracker

Simple, clean, voice-first expense tracker.

- At the end of the day you get a Telegram reminder.
- You reply with a **voice note** (or text) describing what you spent.
- Gemini 2.5 Flash (your key) transcribes + categorizes in one go.
- You get a clean daily summary back in Telegram (exactly like your old n8n flow).
- Beautiful dashboard (Helvetica + your brand colors #89F336 lime and #0000FF blue) with real analytics.

No Google Sheets. No n8n. Fully owned code. Hosted on Vercel + Supabase.

## Stack
- Next.js (Vercel)
- Supabase Postgres
- Gemini 2.5 Flash (audio + structured extraction)
- Telegram Bot API (webhook)

## Quick Start

### 1. Clone & Install
```bash
git clone <your-repo>
cd personal-finance
npm install
```

### 2. Environment Variables
Copy `.env.example` → `.env.local` and fill in:

```bash
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-2.5-flash-lite     # or gemini-2.5-flash
TELEGRAM_BOT_TOKEN=...
ALLOWED_CHAT_ID=your_numeric_chat_id
```

### 3. Create Supabase Tables
Go to your Supabase project → SQL Editor and run this:

```sql
-- Core transactions table (very close to your old Google Sheet)
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  amount numeric(10,2) NOT NULL CHECK (amount >= 0),
  source text DEFAULT 'telegram',
  created_at timestamptz DEFAULT now(),
  raw_input text
);

CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);

-- (Optional) later you can add RLS policies if you want user-level security
```

### 4. Telegram Bot Setup
1. Message [@BotFather](https://t.me/botfather) and create a new bot.
2. Copy the token into `TELEGRAM_BOT_TOKEN`.
3. Start a chat with your bot and send any message.
4. To get your numeric chat ID, message [@userinfobot](https://t.me/userinfobot) or just use the ID from the first message your bot receives (check server logs).
5. Put the number in `ALLOWED_CHAT_ID`.

### 5. Run Locally
```bash
npm run dev -- -p 4321
```

The dashboard is at **http://localhost:4321**

### 6. Connect Telegram Webhook (after deploy or using ngrok for local testing)
After deploying to Vercel, run this once (replace with your real values):

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://your-project.vercel.app/api/telegram"}'
```

For local testing you can use ngrok and point the webhook at the ngrok URL temporarily.

### 7. Daily Reminder (Cron)
`vercel.json` already contains a cron that hits `/api/cron/remind` at 21:00 UTC.

You can change the schedule in `vercel.json` and redeploy.

To match ~9pm IST, use something like `"0 15 * * *"` (adjust as needed).

The cron sends:  
`> Personal Finance Manager: REMINDER! TRANSACTIONS PLEASE`

### 8. Deploy to Vercel
1. Push to GitHub.
2. Import the repo on Vercel.
3. Add all the environment variables from `.env.local`.
4. Deploy.
5. Run the `setWebhook` curl with your production URL.
6. (Optional) Add a `CRON_SECRET` env var and protect the remind endpoint if you want.

## Using It Daily
- Wait for the reminder (or message the bot anytime).
- Send voice note or text like:  
  `"tiffin 60, shawarma 170, petrol 470, biryani 120"`
- Receive the exact summary format you liked.
- Check the dashboard for beautiful analytics (category breakdown, daily trends, etc.).
- Edit / add manually from the web later (easy to extend).

## Colors & Typography
- #89F336 (lime) — primary accent, highlights, success, chart fills
- #0000FF (blue) — structure, links, important labels
- Helvetica Neue / Helvetica / Arial throughout

## Next Improvements (easy to add)
- Real data loading from Supabase on the dashboard
- Edit / delete transactions from the web UI
- Import your old CSV data
- Monthly views + budgets
- Better error handling + confirmation replies from the bot

## Important Notes
- Voice notes are processed directly with Gemini (transcribe + extract in one call). No extra STT service.
- Only your `ALLOWED_CHAT_ID` can talk to the bot.
- Everything is serverless and cheap.

Built for you. Send voice notes on day one.

---

Questions or want a change? Just tell me.
