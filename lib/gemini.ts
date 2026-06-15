import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY!;
const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";

if (!apiKey) {
  console.warn("GEMINI_API_KEY is missing. Gemini calls will fail.");
}

const genAI = new GoogleGenerativeAI(apiKey);

export type ExtractedTransaction = {
  date: string; // YYYY-MM-DD
  description: string;
  category: string;
  amount: number;
};

const CATEGORIES = [
  "food",
  "transport",
  "entertainment",
  "investment",
  "education",
  "personal",
  "lifestyle",
  "others",
];

export async function extractTransactionsFromInput(params: {
  text?: string;
  audioBase64?: string;
  mimeType?: string;
}): Promise<ExtractedTransaction[]> {
  const model = genAI.getGenerativeModel({ model: modelName });

  const today = new Date().toISOString().split("T")[0];

  const systemPrompt = `You are a precise personal expense parser for daily voice/text reports.

Current reference date: ${today} (use this for "today", "yesterday", etc. Always output YYYY-MM-DD)

Allowed categories ONLY (use exact lowercase): ${CATEGORIES.join(", ")}

Instructions:
- Transcribe voice accurately first if audio is present (handle casual Indian English, numbers, food names like tiffin, shawarma, biryani, petrol, etc.).
- Extract EVERY distinct expense mentioned.
- description: concise and natural (e.g. "tiffin", "fried rice", "petrol", "skin care", "McDonald's", "wonderla").
- amount: positive number only (rupees). Parse words and symbols.
- category: best fit from the allowed list. Use "others" sparingly.
- Split combined sentences into separate items.
- Do NOT invent amounts or items. Be conservative and accurate.
- If no clear expenses, return [].

Output format: Return ONLY a valid JSON array. No markdown, no explanations.

Example output:
[
  {"date": "2025-11-21", "description": "tiffin", "category": "food", "amount": 60},
  {"date": "2025-11-21", "description": "petrol", "category": "transport", "amount": 470}
]

Process the following input:`;

  const parts: any[] = [{ text: systemPrompt }];

  if (params.text) {
    parts.push({ text: `\n--- USER TEXT ---\n${params.text}` });
  }

  if (params.audioBase64) {
    parts.push({
      inlineData: {
        mimeType: params.mimeType || "audio/ogg",
        data: params.audioBase64,
      },
    });
  }

  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.1,
        maxOutputTokens: 2048,
      },
    });

    const raw = result.response.text().trim();
    const parsed = JSON.parse(raw);

    if (Array.isArray(parsed)) {
      // Basic validation + normalization
      return parsed
        .filter((item: any) => item && typeof item.amount === "number" && item.description)
        .map((item: any) => ({
          date: item.date || today,
          description: String(item.description).trim(),
          category: CATEGORIES.includes(String(item.category).toLowerCase())
            ? String(item.category).toLowerCase()
            : "others",
          amount: Math.abs(Number(item.amount)),
        }));
    }
    return [];
  } catch (err) {
    console.error("Gemini extraction error:", err);
    return [];
  }
}
