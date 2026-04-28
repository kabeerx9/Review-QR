import { NICHE_LABELS } from "@/constants/niches";

const GROQ_CHAT_URL = "https://api.groq.com/openai/v1/chat/completions";

export interface ReviewInput {
  shopName: string;
  city: string;
  niche: string;
  categories: [string, string, string, string];
  ratings: [number, number, number, number];
}

interface GroqChatResponse {
  choices?: Array<{ message?: { content?: string | null } }>;
  error?: { message?: string };
}

async function runGroqPrompt(prompt: string, temperature = 0.85): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("missing_groq_api_key");
  }

  const model = process.env.GROQ_MODEL?.trim() || "openai/gpt-oss-120b";
  const res = await fetch(GROQ_CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature,
      max_tokens: 512,
    }),
  });

  const raw = await res.text();
  let data: GroqChatResponse;
  try {
    data = JSON.parse(raw) as GroqChatResponse;
  } catch {
    throw new Error(`groq_invalid_json: ${raw.slice(0, 120)}`);
  }

  if (!res.ok) {
    const msg = data.error?.message ?? raw.slice(0, 200);
    throw new Error(`groq_http_${res.status}: ${msg}`);
  }

  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) {
    throw new Error("empty_groq_response");
  }
  return text;
}

export async function generateHinglishReview(input: ReviewInput): Promise<string> {
  const variant = Math.floor(Math.random() * 4) + 1;
  const ratingsText = input.categories
    .map((cat, i) => `- ${cat}: ${input.ratings[i]}/5`)
    .join("\n");

  const nicheLabel = NICHE_LABELS[input.niche] ?? input.niche;

  const prompt = `You are a real Indian customer writing a genuine Google review in Hinglish (mixed Hindi and English, casual, like how Indians actually text each other).

Shop Details:
- Name: ${input.shopName}
- City: ${input.city}
- Type: ${nicheLabel}

My Ratings:
${ratingsText}

Write a natural Hinglish review following these rules:
- 100-150 words exactly
- Sound like a genuine customer, NOT corporate or formal
- Use 1-2 emojis max
- This is structure variant #${variant} — vary the opening and flow
- Highlight things rated 4 or 5 specifically
- Do NOT mention or hint at anything rated below 4
- End with a recommendation
- Do NOT use hashtags
- Do NOT start with "I visited" — vary the opening

Output ONLY the review text. No quotes, no explanation, no preamble.`;

  return runGroqPrompt(prompt, 0.85);
}

export interface MonthlyInsightInput {
  shopName: string;
  city: string;
  niche: string;
  totalReviews: number;
  categoryAverages: [number, number, number, number];
  categories: [string, string, string, string];
  weakestCategory: string;
}

export async function generateMonthlyInsight(input: MonthlyInsightInput): Promise<string> {
  const nicheLabel = NICHE_LABELS[input.niche] ?? input.niche;
  const prompt = `You are a practical growth advisor for an Indian local business owner.

Shop: ${input.shopName} in ${input.city} (${nicheLabel})
Period: last 30 days
Total reviews: ${input.totalReviews}
Average ratings:
- ${input.categories[0]}: ${input.categoryAverages[0].toFixed(2)}/5
- ${input.categories[1]}: ${input.categoryAverages[1].toFixed(2)}/5
- ${input.categories[2]}: ${input.categoryAverages[2].toFixed(2)}/5
- ${input.categories[3]}: ${input.categoryAverages[3].toFixed(2)}/5
Notable weakness: ${input.weakestCategory}

Write 2-3 short, actionable Hinglish sentences for the owner.
Rules:
- Be specific to this data
- Mention weakest category first
- Include one practical next step they can execute this week
- Keep tone direct and friendly
- Output ONLY the insight text`;

  return runGroqPrompt(prompt, 0.6);
}
